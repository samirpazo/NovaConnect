jest.mock("@/lib/storage", () => ({
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { api, setGlobalLogoutCallback } from "@/lib/axios";
import { storage } from "@/lib/storage";

const API_URL = "http://localhost:8080";

describe("axios response interceptor - refresh queue", () => {
  let mockApi: MockAdapter;
  let mockAxios: MockAdapter;
  let logoutCallback: jest.Mock;

  beforeEach(() => {
    mockApi = new MockAdapter(api);
    mockAxios = new MockAdapter(axios);
    logoutCallback = jest.fn();
    setGlobalLogoutCallback(logoutCallback);

    (storage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "token") return Promise.resolve("old-token");
      if (key === "refreshToken") return Promise.resolve("valid-refresh-token");
      return Promise.resolve(null);
    });
    (storage.setItem as jest.Mock).mockResolvedValue(undefined);
    (storage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockApi.reset();
    mockAxios.reset();
    jest.clearAllMocks();
    setGlobalLogoutCallback(null as unknown as () => void);
  });

  it("should refresh token on 401 and retry original request", async () => {
    mockApi.onGet("/test").replyOnce(401);
    mockApi.onGet("/test").replyOnce(200, { ok: true });

    mockAxios.onPost(`${API_URL}/Token/Refresh`).reply(200, {
      Succeeded: true,
      Data: { Token: "new-jwt", RefreshToken: "new-refresh" },
    });

    const response = await api.get("/test");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(storage.setItem).toHaveBeenCalledWith("token", "new-jwt");
    expect(storage.setItem).toHaveBeenCalledWith("refreshToken", "new-refresh");
    expect(logoutCallback).not.toHaveBeenCalled();
  });

  it("should queue concurrent 401s and replay after single refresh", async () => {
    mockApi.onGet("/first").replyOnce(401);
    mockApi.onGet("/first").reply(200, { data: "first" });
    mockApi.onGet("/second").replyOnce(401);
    mockApi.onGet("/second").reply(200, { data: "second" });

    mockAxios.onPost(`${API_URL}/Token/Refresh`).reply(200, {
      Succeeded: true,
      Data: { Token: "new-jwt", RefreshToken: "new-refresh" },
    });

    const [res1, res2] = await Promise.all([
      api.get("/first"),
      api.get("/second"),
    ]);

    expect(res1.status).toBe(200);
    expect(res1.data).toEqual({ data: "first" });
    expect(res2.status).toBe(200);
    expect(res2.data).toEqual({ data: "second" });

    // Solo debe refrescar 1 vez para ambas requests
    expect(mockAxios.history.post.length).toBe(1);
    expect(storage.setItem).toHaveBeenCalledWith("token", "new-jwt");
    expect(logoutCallback).not.toHaveBeenCalled();
  });

  it("should call logout callback when refresh fails", async () => {
    mockApi.onGet("/test").reply(401);
    mockAxios.onPost(`${API_URL}/Token/Refresh`).reply(500);

    await expect(api.get("/test")).rejects.toThrow();
    expect(logoutCallback).toHaveBeenCalled();
  });

  it("should call logout callback when no refresh token exists", async () => {
    (storage.getItem as jest.Mock).mockResolvedValue(null);

    mockApi.onGet("/test").reply(401);

    await expect(api.get("/test")).rejects.toThrow();
    expect(logoutCallback).toHaveBeenCalled();
  });
});
