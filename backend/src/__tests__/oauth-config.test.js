const request = require("supertest");
const app = require("../app");

describe("Google OAuth configuration", () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;

  afterAll(() => {
    if (originalClientId === undefined) {
      delete process.env.GOOGLE_CLIENT_ID;
    } else {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    }
  });

  test("returns a configuration error when the server client ID is missing", async () => {
    process.env.GOOGLE_CLIENT_ID = "";

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "valid-shaped-token-value" });

    expect(response.status).toBe(503);
    expect(response.body.message).toContain("GOOGLE_CLIENT_ID");
  });
});
