const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const driver = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/token");
const { serializeUser } = require("../utils/serializeUser");
const { verifyGoogleToken } = require("../utils/googleAuth");

const SALT_ROUNDS = 10;

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;
  const id = crypto.randomUUID();
  const session = driver.session();

  try {
    const checkResult = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email }
    );

    if (checkResult.records.length > 0) {
      return res.status(400).json({
        message: "Email is already registered. Please login instead.",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate token pair
    const accessToken = generateAccessToken({ userId: id });
    const refreshToken = generateRefreshToken({ userId: id });
    const refreshTokenHash = hashToken(refreshToken);

    const result = await session.run(
      `
      CREATE (u:User {
        id: $id,
        name: $name,
        email: $email,
        passwordHash: $passwordHash,
        refreshTokenHash: $refreshTokenHash,
        authProvider: 'local',
        createdAt: datetime()
      })
      RETURN u
      `,
      { id, name, email, passwordHash, refreshTokenHash }
    );

    const userNode = result.records[0].get("u");

    // Set HTTP-only refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(userNode),
      accessToken,
      token: accessToken, // Backward compatibility alias
      refreshToken,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Failed to register user" });
  } finally {
    await session.close();
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email }
    );

    const userNode = result.records[0]?.get("u");
    const passwordHash = userNode?.properties.passwordHash;
    const isPasswordValid = passwordHash
      ? await bcrypt.compare(password, passwordHash)
      : false;

    // Unified 401 to prevent user enumeration attacks
    if (!userNode || !isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userId = userNode.properties.id;

    // Issue fresh access & refresh tokens
    const accessToken = generateAccessToken({ userId });
    const refreshToken = generateRefreshToken({ userId });
    const refreshTokenHash = hashToken(refreshToken);

    // Store hashed refresh token in database
    await session.run(
      `
      MATCH (u:User {id: $userId})
      SET u.refreshTokenHash = $refreshTokenHash
      RETURN u
      `,
      { userId, refreshTokenHash }
    );

    // Set secure HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: "Logged in successfully",
      user: serializeUser(userNode),
      accessToken,
      token: accessToken, // Backward compatibility alias
      refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  } finally {
    await session.close();
  }
}

// POST /api/auth/google  (and /api/auth/oauth)
// Supports Google ID tokens, Access tokens, and Dev Mode OAuth during development
async function oauthLogin(req, res) {
  let googleUser;

  // 1. Check for Dev Mode simulation (allowed strictly in non-production environments)
  if (req.body.devMode) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Dev mode OAuth is forbidden in production" });
    }
    const devEmail = (req.body.email || "google_user@gmail.com").toLowerCase();
    googleUser = {
      googleId: "google_dev_" + devEmail.replace(/[^a-zA-Z0-9]/g, "_"),
      email: devEmail,
      name: req.body.name || "Google User",
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
      emailVerified: true,
    };
  } else {
    // 2. Real Google OAuth token verification
    if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
      return res.status(503).json({
        message: "Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID.",
      });
    }

    const token =
      req.body.idToken ||
      req.body.credential ||
      req.body.token ||
      req.body.accessToken;

    if (!token) {
      return res.status(400).json({ message: "Google ID token or credential is required" });
    }

    try {
      googleUser = await verifyGoogleToken(token);
    } catch (err) {
      if (err.message?.includes("GOOGLE_CLIENT_ID is missing")) {
        return res.status(503).json({ message: err.message });
      }
      return res.status(401).json({ message: err.message || "Invalid Google token" });
    }
  }

  const { googleId, email, name, avatarUrl } = googleUser;
  const session = driver.session();

  try {
    // Check if user exists by googleId or case-insensitive email
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE u.googleId = $googleId OR toLower(u.email) = toLower($email)
      RETURN u
      LIMIT 1
      `,
      { googleId, email }
    );

    let userNode;
    let userId;

    if (result.records.length === 0) {
      // New user registration via Google OAuth
      userId = crypto.randomUUID();
      const accessToken = generateAccessToken({ userId });
      const refreshToken = generateRefreshToken({ userId });
      const refreshTokenHash = hashToken(refreshToken);

      const createResult = await session.run(
        `
        CREATE (u:User {
          id: $userId,
          name: $name,
          email: $email,
          googleId: $googleId,
          avatarUrl: $avatarUrl,
          authProvider: 'google',
          refreshTokenHash: $refreshTokenHash,
          createdAt: datetime()
        })
        RETURN u
        `,
        { userId, name, email, googleId, avatarUrl, refreshTokenHash }
      );

      userNode = createResult.records[0].get("u");
      setRefreshTokenCookie(res, refreshToken);

      return res.status(201).json({
        message: "Google login successful",
        user: serializeUser(userNode),
        accessToken,
        token: accessToken,
        refreshToken,
      });
    } else {
      // Existing user: Link googleId and sync avatar if not already set
      userNode = result.records[0].get("u");
      userId = userNode.properties.id || crypto.randomUUID();

      const accessToken = generateAccessToken({ userId });
      const refreshToken = generateRefreshToken({ userId });
      const refreshTokenHash = hashToken(refreshToken);

      const updateResult = await session.run(
        `
        MATCH (u:User)
        WHERE u.googleId = $googleId OR toLower(u.email) = toLower($email)
        SET u.id = COALESCE(u.id, $userId),
            u.googleId = $googleId,
            u.refreshTokenHash = $refreshTokenHash,
            u.avatarUrl = COALESCE(u.avatarUrl, $avatarUrl)
        RETURN u
        LIMIT 1
        `,
        { userId, googleId, email, refreshTokenHash, avatarUrl }
      );

      userNode = updateResult.records[0].get("u");
      setRefreshTokenCookie(res, refreshToken);

      return res.json({
        message: "Google login successful",
        user: serializeUser(userNode),
        accessToken,
        token: accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    console.error("OAuth Error:", error);
    res.status(500).json({ message: "OAuth authentication failed" });
  } finally {
    await session.close();
  }
}

// POST /api/auth/refresh
// Handles access token renewal with Refresh Token Rotation (RTR) and reuse detection
async function refresh(req, res) {
  // Read refresh token from HTTP-only cookie or request body
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }

  const userId = decoded.userId;
  const incomingHash = hashToken(incomingRefreshToken);
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (result.records.length === 0) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "User not found" });
    }

    const userNode = result.records[0].get("u");
    const storedHash = userNode.properties.refreshTokenHash;

    // Detect token reuse / revocation
    if (!storedHash || storedHash !== incomingHash) {
      // Possible compromise: Revoke refresh token for this user
      await session.run(
        `
        MATCH (u:User {id: $userId})
        REMOVE u.refreshTokenHash
        `,
        { userId }
      );
      clearRefreshTokenCookie(res);
      return res.status(403).json({
        message: "Refresh token has been revoked or reused. Please sign in again.",
      });
    }

    // Refresh Token Rotation: Issue a NEW access token and a NEW refresh token
    const newAccessToken = generateAccessToken({ userId });
    const newRefreshToken = generateRefreshToken({ userId });
    const newRefreshTokenHash = hashToken(newRefreshToken);

    // Atomically persist new refresh token hash
    const updateResult = await session.run(
      `
      MATCH (u:User {id: $userId})
      SET u.refreshTokenHash = $newRefreshTokenHash
      RETURN u
      `,
      { userId, newRefreshTokenHash }
    );

    const updatedUserNode = updateResult.records[0].get("u");

    // Set new rotated HTTP-only cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      message: "Token refreshed successfully",
      user: serializeUser(updatedUserNode),
      accessToken: newAccessToken,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  } finally {
    await session.close();
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const session = driver.session();
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  let userId = req.userId; // If requireAuth was called or passed

  // If userId not already set from auth header, attempt to decode refresh token
  if (!userId && incomingRefreshToken) {
    try {
      const decoded = verifyRefreshToken(incomingRefreshToken);
      userId = decoded.userId;
    } catch (e) {
      // Ignore token expiry on logout
    }
  }

  try {
    if (userId) {
      // Revoke the refresh token in the database
      await session.run(
        `
        MATCH (u:User {id: $userId})
        REMOVE u.refreshTokenHash
        `,
        { userId }
      );
    }

    clearRefreshTokenCookie(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    clearRefreshTokenCookie(res);
    res.status(500).json({ message: "Failed to logout properly" });
  } finally {
    await session.close();
  }
}

// GET /api/auth/me
// Returns current authenticated user profile
async function getMe(req, res) {
  const userId = req.userId;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userNode = result.records[0].get("u");
    res.json({
      user: serializeUser(userNode),
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Failed to get user profile" });
  } finally {
    await session.close();
  }
}

module.exports = {
  login,
  oauthLogin,
  register,
  refresh,
  logout,
  getMe,
};