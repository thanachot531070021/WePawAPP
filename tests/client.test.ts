import { api, ApiError, configureApi } from "@/api/client";

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("api client", () => {
  const onUnauthorized = jest.fn();
  beforeEach(() => {
    onUnauthorized.mockReset();
    configureApi({ getToken: () => "tok", onUnauthorized });
  });

  it("sends the Bearer token and JSON body", async () => {
    const f = mockFetch(200, { ok: true });
    await api("/api/mobile/pets", { body: { name: "x" } });
    const [, init] = f.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
  });

  it("repeats array query params (species=dog&species=cat)", async () => {
    const f = mockFetch(200, { items: [] });
    await api("/api/mobile/clinics", { query: { species: ["dog", "cat"], q: "", open_now: undefined } });
    expect(f.mock.calls[0][0]).toMatch(/\/api\/mobile\/clinics\?species=dog&species=cat$/);
  });

  it("surfaces Thai action errors with field errors", async () => {
    mockFetch(400, { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: { name: "กรุณากรอกชื่อสัตว์เลี้ยง" } });
    await expect(api("/x", { body: {} })).rejects.toMatchObject({
      message: "กรุณาตรวจสอบข้อมูลที่กรอก",
      status: 400,
      fieldErrors: { name: "กรุณากรอกชื่อสัตว์เลี้ยง" },
    });
  });

  it("translates error codes and signs out on 401", async () => {
    mockFetch(401, { error: "unauthorized" });
    const err = (await api("/x").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("กรุณาเข้าสู่ระบบอีกครั้ง");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not sign out for anonymous calls (wrong password on login)", async () => {
    mockFetch(401, { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    await expect(api("/login", { body: {}, anonymous: true })).rejects.toThrow("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("treats an HTML page (route missing on an older server) as an error, not data", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<!DOCTYPE html><html></html>"),
    }) as unknown as typeof fetch;
    await expect(api("/api/mobile/auth/refresh", { method: "POST" })).rejects.toMatchObject({ status: 404 });
  });

  it("reports network failure in Thai", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as unknown as typeof fetch;
    await expect(api("/x")).rejects.toMatchObject({ status: 0 });
  });
});
