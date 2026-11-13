/**
 * Pruebas del ciclo de vida de la sesión de Nova Connect.
 *
 * Cubre el comportamiento que antes expulsaba al colaborador de la app:
 * un 401 renovaba la sesión? No: estaba comentado y provocaba un logout
 * forzado cada vez que el access token (5 minutos) vencia. Y el propio
 * logout, al responder 401 con el token vencido, se disparaba en cascada.
 *
 *   node scripts/test-session-refresh.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(
    compiled,
    {
      exports,
      process,
      console,
      require: name => {
        assert.ok(name in modules, `Unexpected import ${name}`);
        return modules[name];
      },
    },
    { filename: file },
  );
  return exports;
}

function makeStorage() {
  const stored = new Map();
  return {
    stored,
    getItem: async key => stored.get(key) || null,
    setItem: async (key, value) => {
      stored.set(key, value);
    },
    removeItem: async key => {
      stored.delete(key);
    },
  };
}

async function expectRejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un rechazo');
}

function unauthorized(url, headers = {}) {
  return {
    response: { status: 401 },
    config: { url, headers, method: 'get' },
  };
}

/** Carga el módulo de axios con un cliente falso que registra las llamadas. */
function loadAxios({ platform, storage, refreshResult, postThrows }) {
  const calls = [];
  let responseInterceptor;
  let requestInterceptor;
  const captured = () => requestInterceptor;

  const client = Object.assign(
    async config => {
      calls.push({ kind: 'retry', url: config?.url });
      return { data: { Succeeded: true } };
    },
    {
      interceptors: {
        request: {
          use: fn => {
            requestInterceptor = fn;
          },
        },
        response: {
          use: (ok, onError) => {
            responseInterceptor = onError;
          },
        },
      },
      post: async (url, body) => {
        calls.push({ kind: 'post', url, body });
        if (postThrows && postThrows(url)) {
          throw postThrows(url);
        }
        return refreshResult(url, body);
      },
      get: async url => {
        calls.push({ kind: 'get', url });
        return { data: { Data: 'csrf-test' } };
      },
    },
  );

  const module = load('src/lib/axios.ts', {
    '@/lib/storage': { storage },
    'react-native': { Platform: { OS: platform } },
    axios: {
      create: () => client,
    },
  });

  return {
    module,
    calls,
    client,
    handleError: error => responseInterceptor(error),
    get requestInterceptor() {
      return captured();
    },
  };
}

(async () => {
  // ────────────────────────────────────────────────────────────────
  // 1. Un 401 en una peticion normal renueva la sesion y reintenta.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    const { calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({
        data: { Succeeded: true },
        headers: {
          'set-cookie': [
            'nova_connect_access_token=token-nuevo; HttpOnly',
            'nova_connect_refresh_token=refresh-2; HttpOnly',
          ],
        },
      }),
    });

    const retried = await handleError(unauthorized('/MpwProcessedDocument/Mine'));

    assert.equal(
      calls.filter(c => c.url === '/Token/Refresh').length,
      1,
      'debe renovar la sesion una vez',
    );
    assert.equal(storage.stored.get('token'), 'token-nuevo');
    assert.equal(storage.stored.get('refreshToken'), 'refresh-2');
    assert.ok(
      calls.some(c => c.kind === 'retry' && c.url === '/MpwProcessedDocument/Mine'),
      'debe reintentar la peticion original',
    );
    assert.ok(retried, 'debe resolver con la peticion reintentada');
  }

  // ────────────────────────────────────────────────────────────────
  // 2. En web no se guardan tokens: viaja todo en la cookie HttpOnly.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    const { calls, handleError } = loadAxios({
      platform: 'web',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
    });

    await handleError(unauthorized('/MpwTrainingParticipant/Mine'));

    assert.equal(calls.filter(c => c.url === '/Token/Refresh').length, 1);
    assert.equal(
      calls.find(c => c.url === '/Token/Refresh').body.RefreshToken,
      undefined,
      'en web el refresh token viaja en la cookie, no en el cuerpo',
    );
    assert.equal(storage.stored.has('token'), false);
  }

  // ────────────────────────────────────────────────────────────────
  // 3. Un 401 del propio refresh no abre una cascada de logout.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    let logouts = 0;
    const { module, calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
      postThrows: url =>
        url === '/Token/Refresh' ? unauthorized('/Token/Refresh') : null,
    });
    module.setGlobalLogoutCallback(() => {
      logouts++;
    });

    await expectRejection(
      handleError(unauthorized('/MpwProcessedDocument/Mine')),
    );

    assert.equal(logouts, 1, 'el cierre de sesion debe ocurrir una sola vez');
    assert.equal(
      calls.filter(c => c.kind === 'post' && c.url === '/Token/Logout').length,
      0,
      'no debe pedir un logout que a su vez devuelve 401',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Un 401 en /Token/Logout no dispara el callback de cierre.
  //    Era el origen del bucle infinito: 401 -> logout -> 401 -> logout.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    let logouts = 0;
    const { module, calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
    });
    module.setGlobalLogoutCallback(() => {
      logouts++;
    });

    await expectRejection(handleError(unauthorized('/Token/Logout')));
    await expectRejection(handleError(unauthorized('/Token/Refresh')));
    await expectRejection(
      handleError(unauthorized('/Token/AuthenticationCollaborator')),
    );

    assert.equal(logouts, 0, 'los endpoints /Token no deben cerrar la sesion');
    assert.equal(
      calls.filter(c => c.kind === 'post' && c.url === '/Token/Logout').length,
      0,
      'no debe haber peticiones de logout en cascada',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Varias respuestas 401 simultaneas comparten una sola renovacion.
  //    El backend rota el refresh token: dos renovaciones a la vez
  //    harian que la segunda usara un token ya invalidado.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    const { calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({
        data: { Succeeded: true },
        headers: {
          'set-cookie': [
            'nova_connect_access_token=token-nuevo; HttpOnly',
            'nova_connect_refresh_token=refresh-2; HttpOnly',
          ],
        },
      }),
    });

    await Promise.all([
      handleError(unauthorized('/MpwProcessedDocument/Mine')),
      handleError(unauthorized('/MpwTrainingParticipant/Mine')),
      handleError(unauthorized('/MpwTrainingAttendance/Mine')),
    ]);

    assert.equal(
      calls.filter(c => c.kind === 'post' && c.url === '/Token/Refresh').length,
      1,
      'las renovaciones simultaneas deben compartir un unico vuelo',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Tras volver a iniciar sesion se puede volver a renovar.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    let logouts = 0;
    const { module, calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({
        data: { Succeeded: true },
        headers: {
          'set-cookie': [
            'nova_connect_access_token=token-nuevo; HttpOnly',
            'nova_connect_refresh_token=refresh-2; HttpOnly',
          ],
        },
      }),
    });
    module.setGlobalLogoutCallback(() => {
      logouts++;
    });

    // Primero falla la renovacion: la sesion se cierra.
    const failing = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
      postThrows: url =>
        url === '/Token/Refresh' ? unauthorized('/Token/Refresh') : null,
    });
    failing.module.setGlobalLogoutCallback(() => {
      logouts++;
    });
    await expectRejection(
      failing.handleError(unauthorized('/MpwProcessedDocument/Mine')),
    );
    assert.equal(logouts, 1);

    // El colaborador vuelve a iniciar sesion: la guarda se libera.
    module.markSessionOpen();
    await handleError(unauthorized('/MpwProcessedDocument/Mine'));

    assert.equal(
      calls.filter(c => c.kind === 'post' && c.url === '/Token/Refresh').length,
      1,
      'tras volver a iniciar sesion debe intentarse la renovacion otra vez',
    );
    assert.equal(storage.stored.get('token'), 'token-nuevo');
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Un endpoint /Token* no pide token CSRF. NovaApi los excluye de la
  //    validacion CSRF, y pedirlo ahi hacia fallar la renovacion con un
  //    error 401 que no explicaba nada.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    const { calls, handleError, requestInterceptor } = loadAxios({
      platform: 'web',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
    });

    await requestInterceptor({
      method: 'post',
      url: '/Token/Refresh',
      headers: {},
    });

    assert.equal(
      calls.filter(c => c.kind === 'get' && c.url === '/Token/CsrfToken').length,
      0,
      'los endpoints /Token no deben pedir token CSRF'
    );

    // La exclusion es selectiva: una mutacion normal si la exige.
    await requestInterceptor({
      method: 'post',
      url: '/MpwProcessedDocument/Update',
      headers: {},
    });

    assert.equal(
      calls.filter(c => c.kind === 'get' && c.url === '/Token/CsrfToken').length,
      1,
      'una mutacion normal si debe pedir token CSRF'
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Sin credencial no hay nada que renovar. En el pre-login (documento,
  //    registro, ayuda) un 401 solo significa "todavia no autorizado" y no
  //    debe disparar una renovacion.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    const { calls, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
    });

    await expectRejection(
      handleError({
        response: { status: 401 },
        config: { url: '/GenParameter/GetHelpInfo', headers: {}, method: 'get' },
      })
    );

    assert.equal(
      calls.filter(c => c.kind === 'post' && c.url === '/Token/Refresh').length,
      0,
      'sin refresh token no se debe intentar renovar'
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 6. El fallo de la renovacion explica el motivo del backend.
  //    "No refresh token provided" = la cookie no llego; "Sesion invalida"
  //    = el token ya no es valido en la base de datos.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    const { handleError } = loadAxios({
      platform: 'web',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
      postThrows: url =>
        url === '/Token/Refresh'
          ? {
              response: {
                status: 401,
                data: { Succeeded: false, Message: 'Sesión inválida o expirada' },
              },
              config: { url: '/Token/Refresh', headers: {}, method: 'post' },
            }
          : null,
    });

    const error = await expectRejection(
      handleError(unauthorized('/MpwProcessedDocument/Mine')),
    );

    assert.match(
      error.message,
      /No se pudo renovar la sesion|Sesión inválida o expirada/,
      'el error debe explicar el motivo devuelto por el backend',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 7. Un fallo de red al renovar no cierra la sesion. Sin conexion el
  //    colaborador sigue trabajando con los documentos ya descargados; solo
  //    se cierra la sesion cuando el servidor dice que ya no es valida.
  // ────────────────────────────────────────────────────────────────
  {
    const storage = makeStorage();
    storage.stored.set('token', 'token-vencido');
    storage.stored.set('refreshToken', 'refresh-1');

    let logouts = 0;
    const { module, handleError } = loadAxios({
      platform: 'ios',
      storage,
      refreshResult: () => ({ data: { Succeeded: true }, headers: {} }),
      postThrows: url =>
        url === '/Token/Refresh'
          ? {
              message: 'Network Error',
              config: { url: '/Token/Refresh', headers: {}, method: 'post' },
            }
          : null,
    });
    module.setGlobalLogoutCallback(() => {
      logouts++;
    });

    const error = await expectRejection(
      handleError(unauthorized('/MpwProcessedDocument/Mine')),
    );

    assert.equal(logouts, 0, 'un fallo de red no debe cerrar la sesion');
    assert.match(
      error.message,
      /No se pudo renovar la sesi[oó]n/,
      'el error debe explicar que no hubo respuesta del servidor',
    );
  }

  console.log('Session refresh, logout cascade and token rotation checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
