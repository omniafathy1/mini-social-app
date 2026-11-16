require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Google OAuth is not configured on the server (GOOGLE_CLIENT_ID is missing)");
  }
  return clientId;
}

const client = new OAuth2Client();

/**
 * Verifies a Google ID Token (the "credential" returned by Google Identity Services)
 * and returns the verified claims.
 *
 * Only ID tokens are accepted. An ID token is issued FOR a specific client, and
 * verifyIdToken checks that audience === our GOOGLE_CLIENT_ID. A Google OAuth access
 * token carries no such guarantee: a token issued to any other app could be replayed
 * here and the userinfo endpoint would happily return the victim's email.
 *
 * @param {string} token - Google ID token (JWT)
 * @returns {Promise<{googleId: string, email: string, name: string, avatarUrl: string|null, emailVerified: boolean}>}
 */
async function verifyGoogleToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid Google token");
  }

  const clientId = getGoogleClientId();

  // An ID token is a JWT (3 dot-separated parts). Anything else, such as an access token, is rejected.
  if (token.split(".").length !== 3) {
    throw new Error("A Google ID token is required");
  }

  let payload;
  try {
    // Checks the signature (against Google's public keys), expiry, issuer, and audience
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google ID token verification failed:", error.message);
    throw new Error("Invalid or expired Google credential");
  }

  if (!payload?.sub || !payload.email) {
    throw new Error("Invalid claims in Google credential");
  }

  if (!payload.email_verified) {
    throw new Error("Google email address is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.given_name || payload.email.split("@")[0],
    avatarUrl: payload.picture || null,
    emailVerified: true,
  };
}

module.exports = {
  verifyGoogleToken,
  verifyGoogleIdToken: verifyGoogleToken, // Alias
};