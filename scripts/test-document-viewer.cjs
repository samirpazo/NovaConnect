/**
 * Pruebas del visor de documentos y del almacen offline en web.
 *
 * El PDF se muestra embebido en la aplicacion: se descarga con la sesion y se
 * entrega al visor mediante un blob. Antes el documento se abria en una
 * pestana nueva, lo que perdia la sesion y no permitia descargar el archivo
 * desde la propia app.
 *
 * Ademas el documento se puede guardar en la Cache API del navegador para
 * seguir viéndolo sin conexion.
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
      Response: globals.Response,
      URL: globals.URL,
      caches: globals.caches,
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

  const urlMock = {
    createObjectURL: blob => {
      const url = `blob:mock-${created.length}`;
      created.push({ blob, url });
      return url;
    },
    revokeObjectURL: () => {},
  };

  const window = { URL: urlMock };

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

  return { window, document, created, clicked, urlMock };
}

/** Cache API del navegador simulada. */
function makeCacheApi() {
  const stores = new Map();

  const cacheApi = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(key) {
          const blob = store.get(key);
          return blob ? { blob: async () => blob } : undefined;
        },
        async put(key, response) {
          store.set(key, await response.blob());
        },
        async delete(key) {
          return store.delete(key);
        },
        async keys() {
          return [...store.keys()].map(url => ({ url }));
        },
      };
    },
    async delete(name) {
      return stores.delete(name);
    },
  };

  return { cacheApi, stores };
}

(async () => {
  const browser = makeBrowser();
  const { cacheApi, stores } = makeCacheApi();
  const requests = [];

  const api = {
    get: async (url, config) => {
      requests.push({ url, config });
      return { data: 'pdf-bytes' };
    },
  };

  const BlobMock = class {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type;
    }
  };

  const ResponseMock = class {
    constructor(body, options) {
      this.body = body;
      this.headers = options?.headers;
    }
    async blob() {
      return this.body;
    }
  };

  const globals = {
    window: browser.window,
    document: browser.document,
    Blob: BlobMock,
    Response: ResponseMock,
    URL: browser.urlMock,
    caches: cacheApi,
  };

  const storeModule = load('src/services/pdfCacheStore.ts', {}, globals);

  const module = load(
    'src/services/documentDownload.ts',
    {
      '@/lib/axios': { api },
      '@/services/fileService': {
        fileService: { getFileUrl: id => `/GenFiles/${id}/preview` },
      },
      '@/services/pdfCacheStore': storeModule,
    },
    globals,
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

    assert.equal(
      browser.clicked[browser.clicked.length - 1].download,
      'Contrato.pdf'
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Guardar el documento lo deja disponible sin conexion.
  // ────────────────────────────────────────────────────────────────
  {
    assert.equal(await module.isDocumentCached(42), false);

    const uri = await module.cacheDocument(42);
    assert.match(uri, /^blob:/, 'debe devolver la URL del documento guardado');

    assert.equal(
      await module.isDocumentCached(42),
      true,
      'el documento debe quedar guardado para verse sin conexion',
    );

    const listed = await module.listCachedDocuments();
    assert.equal(listed.length, 1, 'debe listar los documentos guardados');
    assert.equal(listed[0], 42);

    const cachedUri = await module.getCachedDocumentUri(42);
    assert.match(cachedUri, /^blob:/, 'debe poder abrirse sin conexion');

    assert.equal(stores.size, 1, 'debe usar un unico almacen');
  }

  // ────────────────────────────────────────────────────────────────
  // 5. El contenido guardado es el mismo PDF descargado.
  // ────────────────────────────────────────────────────────────────
  {
    const store = stores.values().next().value;
    const saved = store.get('/cached_pdf/42.pdf');
    assert.ok(saved, 'el PDF debe estar en la Cache API');
    assert.equal(saved.type, 'application/pdf');
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Liberar el espacio elimina los documentos guardados.
  // ────────────────────────────────────────────────────────────────
  {
    await module.clearCachedDocuments();

    assert.equal(await module.isDocumentCached(42), false);
    const remaining = await module.listCachedDocuments();
    assert.equal(remaining.length, 0, 'no debe quedar ningun documento guardado');
  }

  console.log('Document viewer (web embed, download and offline cache) checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
