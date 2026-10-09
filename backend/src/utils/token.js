require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Access and Refresh Token secrets
function getAccessTokenSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or ACCESS_TOKEN_SECRET is not defined in environment variables");
  }
  return secret;
}

function getRefreshTokenSecret() {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (secret) return secret;
  // Fallback to a distinct derived secret based on JWT_SECRET if REFRESH_TOKEN_SECRET isn't explicitly configured
  const baseSecret = process.env.JWT_SECRET;
  if (!baseSecret) {
    throw new Error("JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables");
  }
  return crypto.createHmac("sha256", baseSecret).update("refresh-token-salt").digest("hex");
}

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Generates a short-lived Access Token (15 minutes by default).
 * Payload contains userId.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, getAccessTokenSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates a long-lived Refresh Token (7 days by default).
 * Includes a unique jti (JWT ID) to ensure uniqueness even if generated in the same millisecond.
 */
function generateRefreshToken(payload) {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, getRefreshTokenSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verifies an Access Token.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, getAccessTokenSecret());
}

/**
 * Verifies a Refresh Token.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshTokenSecret());
}

/**
 * Hashes a refresh token with SHA-256 before persisting to Neo4j.
 * Prevents plain-text storage in the database.
 */
function hashToken(token) {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Sets the refresh token as a secure, httpOnly cookie on the response.
 */
function setRefreshTokenCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth", // Only transmitted to auth routes (refresh, logout)
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

/**
 * Clears the refresh token cookie.
 */
function clearRefreshTokenCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  // Backward compatibility aliases
  generateToken: generateAccessToken,
  verifyToken: verifyAccessToken,
};