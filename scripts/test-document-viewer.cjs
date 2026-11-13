/**
 * Pruebas del visor de documentos en web.
 *
 * El PDF se muestra embebido en la aplicacion: se descarga con la sesion y se
 * entrega al visor mediante un blob. Antes el documento se abria en una
 * pestana nueva, lo que perdia la sesion y no permitia descargar el archivo
 * desde la propia app.
 *
 *   node scripts/test-document-viewer.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules, globals) {
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
      setTimeout,
      Blob: globals.Blob,
      window: globals.window,
      document: globals.document,
      require: name => {
        assert.ok(name in modules, `Unexpected import ${name}`);
        return modules[name];
      },
    },
    { filename: file },
  );
  return exports;
}

/** Entorno de navegador minimo: solo lo que usa el visor. */
function makeBrowser() {
  const created = [];
  const clicked = [];

  const window = {
    URL: {
      createObjectURL: blob => {
        const url = `blob:mock-${created.length}`;
        created.push({ blob, url });
        return url;
      },
      revokeObjectURL: () => {},
    },
  };

  const document = {
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    createElement: tag => {
      const element = { tag, click: () => clicked.push(element) };
      return element;
    },
  };

  return { window, document, created, clicked };
}

(async () => {
  const browser = makeBrowser();
  const requests = [];

  const api = {
    get: async (url, config) => {
      requests.push({ url, config });
      return { data: 'pdf-bytes' };
    },
  };

  const module = load(
    'src/services/documentDownload.ts',
    {
      '@/lib/axios': { api },
      '@/services/fileService': {
        fileService: { getFileUrl: id => `/GenFiles/${id}/preview` },
      },
    },
    {
      window: browser.window,
      document: browser.document,
      Blob: class {
        constructor(parts, options) {
          this.parts = parts;
          this.type = options?.type;
        }
      },
    },
  );

  // ────────────────────────────────────────────────────────────────
  // 1. El documento se descarga con la sesion y devuelve un blob URL.
  // ────────────────────────────────────────────────────────────────
  {
    const url = await module.downloadDocument(42);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/GenFiles/42/preview');
    assert.equal(requests[0].config.responseType, 'blob');
    assert.match(url, /^blob:/, 'debe devolver una URL de objeto');
    assert.equal(browser.created[0].blob.type, 'application/pdf');
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Descargar guarda el archivo en el equipo.
  // ────────────────────────────────────────────────────────────────
  {
    await module.saveDocumentToDevice(42, 'Contrato');

    assert.equal(browser.clicked.length, 1, 'debe pulsar el enlace de descarga');
    const link = browser.clicked[0];
    assert.equal(link.tag, 'a');
    assert.match(link.href, /^blob:/);
    assert.equal(link.download, 'Contrato.pdf');

    // Safari ignora el atributo download si el blob conserva el tipo pdf.
    assert.equal(
      browser.created[browser.created.length - 1].blob.type,
      'application/octet-stream',
      'la descarga debe forzarse con octet-stream',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 3. Un nombre con extension .pdf no se duplica.
  // ────────────────────────────────────────────────────────────────
  {
    await module.saveDocumentToDevice(7, 'Contrato.pdf');

    assert.equal(browser.clicked[browser.clicked.length - 1].download, 'Contrato.pdf');
  }

  // ────────────────────────────────────────────────────────────────
  // 4. En web no hay cache persistente: el blob vive en memoria.
  // ────────────────────────────────────────────────────────────────
  {
    assert.equal(await module.isDocumentCached(42), false);
  }

  console.log('Document viewer (web embed and download) checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
