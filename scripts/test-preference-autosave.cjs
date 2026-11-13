const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const calls = [];
const requests = [];
let timer;
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/services/secCollaboratorPreferenceService.ts", "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText,
  {
    exports: exportsObject,
    require: () => ({
      api: {
        post: (_url, body) => {
          calls.push(body);
          return new Promise((resolve, reject) =>
            requests.push({ resolve, reject }),
          );
        },
      },
    }),
    setTimeout: (callback) => {
      timer = callback;
      return 1;
    },
    clearTimeout: () => {
      timer = null;
    },
  },
);
const tick = () => new Promise((resolve) => setImmediate(resolve));
(async () => {
  const results = [];
  const queue = exportsObject.queuePreferenceSave;
  queue({ Theme: "light" }, (saved) => results.push(saved));
  queue({ Theme: "dark" }, (saved) => results.push(saved));
  timer();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].Theme, "dark", "Los cambios rápidos se agrupan");
  queue({ Theme: "system" }, (saved) => results.push(saved));
  timer();
  assert.equal(calls.length, 1, "No hay peticiones simultáneas");
  requests[0].resolve({ data: {} });
  await tick();
  assert.equal(calls[1].Theme, "system");
  requests[1].reject(new Error("offline"));
  await tick();
  assert.deepEqual(results, [true, false]);
  queue({ Theme: "system" }, (saved) => results.push(saved));
  timer();
  requests[2].resolve({ data: {} });
  await tick();
  assert.deepEqual(
    results,
    [true, false, true],
    "Permite reintentar tras un fallo",
  );
  queue({ Theme: "light" }, (saved) => results.push(saved));
  timer();
  requests[3].resolve({ data: { Succeeded: false } });
  await tick();
  assert.equal(
    results.at(-1),
    false,
    "Un rechazo del backend no se muestra como guardado",
  );
  console.log(
    "Preference autosave batching, ordering and retry checks passed.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
