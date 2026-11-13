/**
 * Pruebas de la foto de la persona del colaborador.
 *
 * La app nunca obtuvo foto porque el login no trae `PrsPhoto`: ese campo no
 * existe en NovaApi. La foto se pide al endpoint que devuelve el archivo de la
 * persona a partir del PrsID del claim.
 *
 *   node scripts/test-person-photo.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules, globals = {}) {
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
      ...globals,
      // El contexto de vm no hereda los globals del navegador.
      btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
      require: (name) => {
        assert.ok(name in modules, `Unexpected import ${name}`);
        return modules[name];
      },
    },
    { filename: file },
  );
  return exports;
}

function imageBuffer() {
  const bytes = new Uint8Array([137, 80, 78, 71]);
  return bytes.buffer;
}

(async () => {
  const calls = [];
  const photos = new Map();
  const personPhotoCache = {
    get: async (owner) => photos.get(owner) ?? null,
    set: async (owner, source) => photos.set(owner, source),
    remove: async (owner) => photos.delete(owner),
  };
  const build = (handler) => {
    const api = {
      get: async (url, config) => {
        calls.push({ url, config });
        return handler(url, config);
      },
      post: async () => ({ data: {} }),
    };
    return load('src/services/fileService.ts', {
      '@/lib/axios': { api },
      '@/services/personPhotoCache': { personPhotoCache },
    });
  };

  // 1. Devuelve un data URI a partir del archivo binario.
  {
    const { fileService } = build(() => ({
      data: imageBuffer(),
      headers: { 'content-type': 'image/png' },
    }));

    const photo = await fileService.getMyPhoto();

    assert.ok(photo, 'debe devolver la foto');
    assert.ok(
      photo.startsWith('data:image/png;base64,'),
      'debe ser un data URI',
    );
    assert.equal(calls.at(-1).url, '/GenPerson/MyPhoto');
    assert.equal(calls.at(-1).config.responseType, 'arraybuffer');
  }

  // 2. Una respuesta que no es imagen no se muestra.
  {
    const { fileService } = build(() => ({
      data: imageBuffer(),
      headers: { 'content-type': 'application/json' },
    }));

    assert.equal(await fileService.getMyPhoto(), null);
  }

  // 3. Sin foto (404) o sin permiso: la app sigue con las iniciales.
  {
    const { fileService } = build(() => {
      throw new Error('404');
    });

    assert.equal(await fileService.getMyPhoto(), null);
  }

  {
    const { fileService: online } = build(() => ({
      data: imageBuffer(),
      headers: { 'content-type': 'image/png' },
    }));
    const source = await online.getMyPhoto('person-7');
    assert.equal(await online.getCachedMyPhoto('person-7'), source);
    assert.equal(
      await online.getCachedMyPhoto('person-8'),
      null,
      'La foto pertenece solo a esa persona',
    );
    const { fileService: offline } = build(() => {
      throw { code: 'ERR_NETWORK' };
    });
    assert.equal(
      await offline.getMyPhoto('person-7'),
      source,
      'Conserva la foto si falla la red',
    );
    assert.equal(await offline.getMyPhoto('person-8'), null);
    const { fileService: deleted } = build(() => {
      throw { response: { status: 404 } };
    });
    assert.equal(await deleted.getMyPhoto('person-7'), null);
    assert.equal(
      await deleted.getCachedMyPhoto('person-7'),
      null,
      'Una foto retirada por el servidor no queda obsoleta en caché',
    );
  }

  // La capa web persiste entre instancias y separa las claves por persona.
  {
    const entries = new Map();
    const caches = {
      open: async () => ({
        match: async (key) => entries.get(key)?.clone(),
        put: async (key, response) => entries.set(key, response),
        delete: async (key) => entries.delete(key),
      }),
      delete: async () => entries.clear(),
    };
    const globals = { caches, Response };
    const first = load(
      'src/services/personPhotoCache.ts',
      {},
      globals,
    ).personPhotoCache;
    await first.set('person-7', 'data:image/png;base64,photo');
    const reopened = load(
      'src/services/personPhotoCache.ts',
      {},
      globals,
    ).personPhotoCache;
    assert.equal(await reopened.get('person-7'), 'data:image/png;base64,photo');
    assert.equal(await reopened.get('person-8'), null);
    await reopened.clear();
    assert.equal(await first.get('person-7'), null);
  }

  // Nativo conserva la foto en disco y puede leerla sin peticiones de red.
  {
    const files = new Map();
    class File {
      constructor(_directory, name) {
        this.name = name;
      }
      get exists() {
        return files.has(this.name);
      }
      write(source) {
        files.set(this.name, source);
      }
      async text() {
        return files.get(this.name);
      }
      delete() {
        files.delete(this.name);
      }
    }
    class Directory {
      create() {}
      get exists() {
        return true;
      }
      delete() {
        files.clear();
      }
    }
    const { personPhotoCache: cache } = load(
      'src/services/personPhotoCache.native.ts',
      {
        'expo-file-system': {
          File,
          Directory,
          Paths: { document: '/documents' },
        },
      },
    );
    await cache.set('person-7', 'data:image/png;base64,photo');
    assert.equal(await cache.get('person-7'), 'data:image/png;base64,photo');
    assert.equal(await cache.get('person-8'), null);
    await cache.remove('person-7');
    assert.equal(await cache.get('person-7'), null);
  }

  console.log('Person photo fetch checks passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
