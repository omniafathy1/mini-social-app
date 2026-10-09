const request = require("supertest");
const app = require("../app");
const driver = require("../config/db");

describe("Authentication & Token Flow Integration Tests", () => {
  const testUser = {
    name: "Auth Tester",
    email: `tester_${Date.now()}@example.com`,
    password: "Password123!",
  };

  let accessToken = null;
  let refreshCookie = null;
  let registeredUserId = null;

  afterAll(async () => {
    // Cleanup test user from database
    if (registeredUserId) {
      const session = driver.session();
      try {
        await session.run(`MATCH (u:User {id: $id}) DETACH DELETE u`, { id: registeredUserId });
      } finally {
        await session.close();
      }
    }
    await driver.close();
  });

  test("1. POST /api/auth/register should create user, return access token and set-cookie refreshToken", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined(); // Never leaked
    expect(res.body.user.refreshTokenHash).toBeUndefined(); // Never leaked

    registeredUserId = res.body.user.id;
    accessToken = res.body.accessToken;

    // Check HTTP-only cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieStr = cookies.find((c) => c.startsWith("refreshToken="));
    expect(cookieStr).toBeDefined();
    expect(cookieStr).toContain("HttpOnly");
    refreshCookie = cookieStr.split(";")[0];
  });

  test("2. POST /api/auth/register with duplicate email should be rejected with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already registered");
  });

  test("3. POST /api/auth/login with valid credentials should return new tokens and cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.id).toBe(registeredUserId);

    const cookies = res.headers["set-cookie"];
    const cookieStr = cookies.find((c) => c.startsWith("refreshToken="));
    expect(cookieStr).toBeDefined();
    refreshCookie = cookieStr.split(";")[0];
    accessToken = res.body.accessToken;
  });

  test("4. POST /api/auth/login with wrong password should fail with 401 without leaking details", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "WrongPassword99!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  test("5. GET /api/auth/me should return authenticated user profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(registeredUserId);
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  test("6. GET /api/auth/me without token should return 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("7. POST /api/auth/refresh with valid cookie should issue new access token & rotate refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [refreshCookie]);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.id).toBe(registeredUserId);

    const newCookies = res.headers["set-cookie"];
    const newCookieStr = newCookies.find((c) => c.startsWith("refreshToken="));
    expect(newCookieStr).toBeDefined();

    const oldRefreshCookie = refreshCookie;
    const newRefreshCookie = newCookieStr.split(";")[0];
    expect(newRefreshCookie).not.toBe(oldRefreshCookie);

    // 8. Reusing the OLD refresh token must trigger reuse detection and return 403
    const reuseRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [oldRefreshCookie]);

    expect(reuseRes.status).toBe(403);
    expect(reuseRes.body.message).toContain("revoked or reused");
  });

  test("9. POST /api/auth/logout should clear cookie and revoke refresh token", async () => {
    // Login again to get a fresh valid session
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    const cookieStr = loginRes.headers["set-cookie"].find((c) => c.startsWith("refreshToken="));
    const activeCookie = cookieStr.split(";")[0];

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [activeCookie]);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe("Logged out successfully");

    // Attempting to refresh with the logged-out token must fail
    const refreshAfterLogout = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [activeCookie]);

    expect([401, 403]).toContain(refreshAfterLogout.status);
  });

  test("10. POST /api/auth/oauth should reject requests without Google token", async () => {
    const res = await request(app)
      .post("/api/auth/oauth")
      .send({});

    expect(res.status).toBe(400);
  });

  test("11. POST /api/auth/google in dev mode should create OAuth user, return access token and set refresh cookie", async () => {
    const devOAuthEmail = `dev_oauth_${Date.now()}@gmail.com`;
    const res = await request(app)
      .post("/api/auth/google")
      .send({ devMode: true, email: devOAuthEmail, name: "Google Dev User" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(devOAuthEmail.toLowerCase());
    expect(res.body.user.authProvider).toBe("google");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieStr = cookies.find((c) => c.startsWith("refreshToken="));
    expect(cookieStr).toBeDefined();
    expect(cookieStr).toContain("HttpOnly");

    // Cleanup OAuth test user
    const session = driver.session();
    try {
      await session.run(`MATCH (u:User {id: $id}) DETACH DELETE u`, { id: res.body.user.id });
    } finally {
      await session.close();
    }
  });

  test("12. POST /api/auth/google with devMode in production environment must be rejected with 403", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const res = await request(app)
        .post("/api/auth/google")
        .send({ devMode: true, email: "hacker@gmail.com" });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("forbidden");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
