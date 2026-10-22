const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, process, console, require: name => {
    assert.ok(name in modules, `Unexpected import ${name}`);
    return modules[name];
  } }, { filename: file });
  return exports;
}

(async () => {
  for (const platform of ['web', 'ios']) {
    const stored = new Map();
    const calls = [];
    const storage = {
      getItem: async key => stored.get(key) || null,
      setItem: async (key, value) => stored.set(key, value),
      removeItem: async key => stored.delete(key),
    };
    const api = { post: async (url, body) => {
      calls.push({ url, body });
      return { data: { Succeeded: true, Data: { Token: 'do-not-use-body', RefreshToken: 'do-not-use-body', Collaborator: { ColID: 7 } } },
        headers: { 'set-cookie': ['nova_connect_access_token=access-cookie; HttpOnly', 'nova_connect_refresh_token=refresh-cookie; HttpOnly'] } };
    } };
    const { authService } = load('src/services/authService.ts', { '@/lib/axios': { api }, '@/lib/storage': { storage }, 'react-native': { Platform: { OS: platform } } });
    await authService.requestEnrollmentOtp('12345678');
    await authService.registerCollaborator('12345678', '123456', 'client-hash');
    assert.equal(calls[0].url, '/SecCollaborator/RequestEnrollmentOtp');
    assert.equal(calls[1].url, '/SecCollaborator/ConfirmEnrollment');
    assert.equal(calls[1].body.DocumentNumber, '12345678');
    assert.equal(calls[1].body.Otp, '123456');
    assert.equal(calls[1].body.PrsID, undefined);
    const login = await authService.loginCollaborator({ DocumentNumber: '12345678' });
    assert.equal(login.success, true);
    assert.equal(stored.get('token'), platform === 'web' ? undefined : 'access-cookie');
    assert.equal(stored.get('refreshToken'), platform === 'web' ? undefined : 'refresh-cookie');
    assert.ok(!JSON.stringify([...stored]).includes('do-not-use-body'));
    await authService.logout();
    assert.equal(calls.at(-1).url, '/Token/Logout');
    assert.equal(stored.size, 0);

    let intercept;
    const client = { interceptors: { request: { use: fn => { intercept = fn; } }, response: { use: () => {} } },
      get: async url => { assert.equal(url, '/Token/CsrfToken'); return { data: { Data: 'csrf-test' } }; } };
    stored.set('token', 'native-access');
    const { api: configured } = load('src/lib/axios.ts', { '@/lib/storage': { storage }, 'react-native': { Platform: { OS: platform } },
      axios: { create: options => { assert.equal(options.withCredentials, platform === 'web'); return client; } } });
    assert.equal(configured, client);
    const request = await intercept({ method: 'post', headers: {} });
    assert.equal(request.headers['X-Nova-Client'], 'nova-connect');
    assert.equal(request.headers['X-Client-Platform'], platform === 'web' ? 'web' : 'native');
    assert.equal(request.headers.Authorization, platform === 'web' ? undefined : 'Bearer native-access');
    assert.equal(request.headers['X-CSRF-TOKEN'], platform === 'web' ? 'csrf-test' : undefined);
  }
  console.log('Enrollment and cookie/CSRF transport checks passed on web and native.');
})().catch(error => { console.error(error); process.exitCode = 1; });
