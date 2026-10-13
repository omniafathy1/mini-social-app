const { verifyAccessToken } = require("../utils/token");

/**
 * Middleware that strictly protects routes by validating the Bearer access token.
 * Attaches decoded userId to req.userId.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

module.exports = requireAuth;