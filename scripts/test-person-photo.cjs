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
      // El contexto de vm no hereda los globals del navegador.
      btoa: value => Buffer.from(value, 'binary').toString('base64'),
      require: name => {
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
  const build = handler => {
    const api = {
      get: async (url, config) => {
        calls.push({ url, config });
        return handler(url, config);
      },
      post: async () => ({ data: {} }),
    };
    return load('src/services/fileService.ts', { '@/lib/axios': { api } });
  };

  // 1. Devuelve un data URI a partir del archivo binario.
  {
    const { fileService } = build(() => ({
      data: imageBuffer(),
      headers: { 'content-type': 'image/png' },
    }));

    const photo = await fileService.getMyPhoto();

    assert.ok(photo, 'debe devolver la foto');
    assert.ok(photo.startsWith('data:image/png;base64,'), 'debe ser un data URI');
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

  console.log('Person photo fetch checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
