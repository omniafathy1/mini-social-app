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
 * Verifies a Google ID Token (JWT) or a Google Access Token
 * and returns verified claims (sub, email, name, avatarUrl, emailVerified).
 *
 * Supports:
 * 1. Google Identity Services ID Token (credential / idToken)
 * 2. Google OAuth 2.0 Access Token (access_token) via Google UserInfo API
 *
 * @param {string} token - Google ID Token or Access Token
 * @returns {Promise<{googleId: string, email: string, name: string, avatarUrl: string|null, emailVerified: boolean}>}
 */
async function verifyGoogleToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid Google token");
  }

  const clientId = getGoogleClientId();
  const isJwt = token.includes(".") && token.split(".").length === 3;

  if (isJwt) {
    // Attempt verification via google-auth-library
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Unable to retrieve payload from Google ID token");
      }

      if (!payload.email_verified) {
        throw new Error("Google email address is not verified");
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.given_name || payload.email.split("@")[0],
        avatarUrl: payload.picture || null,
        emailVerified: Boolean(payload.email_verified),
      };
    } catch (libraryErr) {
      // Fallback: Verify ID token using Google's public tokeninfo endpoint
      try {
        const response = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
        );
        if (!response.ok) {
          throw new Error(`Google tokeninfo endpoint returned status ${response.status}`);
        }
        const data = await response.json();

        if (!data.email || !data.sub) {
          throw new Error("Invalid token claims returned by Google");
        }

        const isVerified = data.email_verified === "true" || data.email_verified === true;
        if (!isVerified) {
          throw new Error("Google email address is not verified");
        }

        if (data.aud !== clientId) {
          throw new Error("Token audience mismatch");
        }

        return {
          googleId: data.sub,
          email: data.email.toLowerCase(),
          name: data.name || data.given_name || data.email.split("@")[0],
          avatarUrl: data.picture || null,
          emailVerified: true,
        };
      } catch (fallbackErr) {
        console.error("Google ID token verification failed:", libraryErr.message, fallbackErr.message);
        throw new Error("Invalid or expired Google OAuth credential");
      }
    }
  } else {
    // Treat as Google OAuth 2.0 Access Token -> verify against Google's userinfo endpoint
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google userinfo returned status ${response.status}`);
      }

      const userInfo = await response.json();
      if (!userInfo.sub || !userInfo.email) {
        throw new Error("Invalid claims returned from Google UserInfo endpoint");
      }

      if (!userInfo.email_verified) {
        throw new Error("Google email address is not verified");
      }

      return {
        googleId: userInfo.sub,
        email: userInfo.email.toLowerCase(),
        name: userInfo.name || userInfo.given_name || userInfo.email.split("@")[0],
        avatarUrl: userInfo.picture || null,
        emailVerified: Boolean(userInfo.email_verified),
      };
    } catch (accessErr) {
      console.error("Google access token verification failed:", accessErr.message);
      throw new Error("Invalid or expired Google OAuth access token");
    }
  }
}

module.exports = {
  verifyGoogleToken,
  verifyGoogleIdToken: verifyGoogleToken, // Alias
};
