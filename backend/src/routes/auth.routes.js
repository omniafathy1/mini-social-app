const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const requireAuth = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const {
  registerSchema,
  loginSchema,
  oauthSchema,
  refreshTokenSchema,
} = require("../validators/Auth.schema");

const {
  login,
  oauthLogin,
  register,
  refresh,
  logout,
  getMe,
} = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Google OAuth routes
router.post("/oauth", validate(oauthSchema), oauthLogin);
router.post("/google", validate(oauthSchema), oauthLogin);

// Token refresh & revocation
router.post("/refresh", validate(refreshTokenSchema), refresh);
router.post("/logout", optionalAuth, logout);

// Current user profile
router.get("/me", requireAuth, getMe);

module.exports = router;