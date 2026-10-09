const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/token");

describe("Token Utilities", () => {
  const mockPayload = { userId: "test-user-123" };

  test("should generate and verify an access token", () => {
    const token = generateAccessToken(mockPayload);
    expect(typeof token).toBe("string");

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
  });

  test("should generate and verify a refresh token with unique jti", () => {
    const token1 = generateRefreshToken(mockPayload);
    const token2 = generateRefreshToken(mockPayload);

    expect(token1).not.toBe(token2); // Different jti even with same payload

    const decoded = verifyRefreshToken(token1);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.jti).toBeDefined();
  });

  test("should hash a token consistently with SHA-256", () => {
    const token = "my-secret-test-token";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).not.toBe(token);
  });

  test("should reject verifying a refresh token with access token verifier", () => {
    // Because they use different secrets
    const refreshToken = generateRefreshToken(mockPayload);
    expect(() => {
      verifyAccessToken(refreshToken);
    }).toThrow();
  });
});
