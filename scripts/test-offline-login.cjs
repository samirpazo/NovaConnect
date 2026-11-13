const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const CryptoJS = require('crypto-js');
function load(file, modules, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    console,
    ...extra,
    require: (name) => {
      assert.ok(name in modules, `Unexpected import ${name}`);
      return modules[name];
    },
  });
  return exports;
}
(async () => {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) || null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async (key) => values.delete(key),
  };
  let now = Date.now();
  let clearedFiles = 0;
  const { offlineAuthService: offline } = load(
    'src/services/offlineAuthService.ts',
    {
      'crypto-js': CryptoJS,
      '@/lib/storage': { storage },
      '@/lib/security': { hashPassword: (pin) => `server-${pin}` },
      '@/services/documentDownload': {
        clearCachedDocuments: async () => {
          clearedFiles++;
        },
      },
      '@/services/offlineDocuments': {
        offlineDocumentsService: { clear: async () => {} },
      },
    },
    { Date: { now: () => now } },
  );
  const user = { UsrID: 7, PrsDocumentNumber: '12345678', FullName: 'Prueba' };
  await offline.save('12345678', 'server-123456', user);
  assert.ok(
    !values.get('nova-connect.offlineSession').includes('server-123456'),
    'No almacena una credencial reutilizable contra el servidor',
  );
  assert.equal(await offline.verify('87654321', '123456'), null);
  assert.equal((await offline.verify('12345678', '123456')).user.UsrID, 7);
  for (let i = 0; i < 5; i++)
    assert.equal(await offline.verify('12345678', '000000'), null);
  assert.equal(
    await offline.verify('12345678', '123456'),
    null,
    'Bloquea temporalmente tras intentos fallidos',
  );
  now += 31000;
  assert.ok(await offline.verify('12345678', '123456'));

  let state;
  let onlineResult = { success: false, networkError: true };
  let invalidated;
  let localVerifications = 0;
  const { useAuthStore: store } = load('src/stores/useAuthStore.ts', {
    zustand: {
      create: (init) => {
        state = init(
          (patch) => {
            Object.assign(state, patch);
          },
          () => state,
        );
        const store = () => state;
        store.getState = () => state;
        return store;
      },
    },
    '@/services/authService': {
      authService: {
        loginCollaborator: async () => onlineResult,
        logout: async () => values.delete('user'),
      },
    },
    '@/services/offlineAuthService': {
      offlineAuthService: {
        ...offline,
        verifyHash: async (...args) => {
          localVerifications++;
          return offline.verifyHash(...args);
        },
      },
    },
    '@/lib/storage': { storage },
    '@/lib/axios': {
      markSessionOpen: () => {},
      setGlobalLogoutCallback: (callback) => {
        invalidated = callback;
      },
    },
  });
  const result = await state.login({
    DocumentNumber: '12345678',
    Password: 'server-123456',
  });
  assert.equal(result.offline, true);
  assert.equal(store.getState().user.UsrID, 7);
  assert.equal(
    values.has('token'),
    false,
    'El login local no inventa tokens de servidor',
  );
  onlineResult = { success: false, error: 'PIN rechazado' };
  assert.equal(
    (
      await state.login({
        DocumentNumber: '12345678',
        Password: 'server-123456',
      })
    ).success,
    false,
  );
  assert.equal(
    localVerifications,
    1,
    'Un rechazo del servidor no activa fallback offline',
  );
  await state.logout();
  assert.ok(
    await offline.get(),
    'Salir no elimina el acceso local previamente validado',
  );
  await offline.save('87654321', 'server-654321', {
    ...user,
    PrsDocumentNumber: '87654321',
  });
  assert.equal(
    clearedFiles,
    1,
    'Cambiar de cuenta retira los documentos locales de la cuenta anterior',
  );
  await offline.clear();
  assert.equal(
    await offline.get(),
    null,
    'Olvidar el acceso elimina el verificador',
  );
  {
    let failure;
    await storage.setItem('user', JSON.stringify(user));
    const document = {
      PdcID: 1,
      PdcFilID: 10,
      PdcPeriodYear: '2026',
      PdcPeriodMonth: 'Octubre',
      PdcIsReceived: true,
    };
    const { processedDocumentService: documents } = load(
      'src/services/processedDocumentService.ts',
      {
        '@/lib/axios': {
          api: {
            get: async () => {
              if (failure) throw failure;
              return {
                data: { Data: [document, { ...document, PdcFilID: 11 }] },
              };
            },
          },
        },
        '@/lib/storage': { storage },
        '@/services/documentDownload': {
          listCachedDocuments: async () => [10],
        },
        '@/services/offlineDocuments': {
          offlineDocumentsService: { list: async () => [] },
        },
      },
    );
    await documents.getDocuments(true);
    failure = { code: 'ERR_NETWORK' };
    const saved = await documents.getDocuments(true);
    assert.equal(
      saved.length,
      1,
      'Sin conexión lista solo PDF realmente guardados',
    );
    assert.equal(saved[0].PdcFilID, 10);
    failure = { response: { status: 401 } };
    await assert.rejects(
      documents.getDocuments(true),
      'Un 401 no se convierte en datos locales',
    );
  }
  console.log(
    'Offline PIN verification, lockout, network fallback and account isolation checks passed.',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
