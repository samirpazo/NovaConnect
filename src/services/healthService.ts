import { api } from "@/lib/axios";

export type HealthStatus = {
  ready: boolean;
  live: boolean;
  error?: string;
};

export const healthService = {
  async check(): Promise<HealthStatus> {
    const result: HealthStatus = { ready: false, live: false };

    try {
      const readyRes = await api.get("/health/ready");
      result.ready = readyRes.status === 200;
    } catch {
      result.ready = false;
    }

    try {
      const liveRes = await api.get("/health/live");
      result.live = liveRes.status === 200;
    } catch {
      result.live = false;
    }

    result.error =
      !result.ready || !result.live
        ? "El backend no está completamente operativo"
        : undefined;

    return result;
  },
};
