const { verifyAccessToken } = require("../utils/token");

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, populates req.userId.
 * Does not reject requests without a token or with an invalid/expired token.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        req.userId = decoded.userId;
      }
    } catch (error) {
      // Ignore token verification errors for optional auth
    }
  }

  next();
}

module.exports = optionalAuth;