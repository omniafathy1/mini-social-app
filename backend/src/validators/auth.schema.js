const { z } = require("zod");

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const nameField = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters");

const newPasswordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: newPasswordField,
});

const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

// OAuth Schema: Accepts ID Token, credential, access token, or devMode in development
const oauthSchema = z
  .object({
    idToken: z.string().min(10).optional(),
    credential: z.string().min(10).optional(),
    token: z.string().min(10).optional(),
    accessToken: z.string().min(10).optional(),
    devMode: z.boolean().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.idToken ||
        data.credential ||
        data.token ||
        data.accessToken ||
        data.devMode
      ),
    {
      message: "Either Google token/credential or devMode must be provided",
      path: ["token"],
    }
  );

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token must not be empty").optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  oauthSchema,
  refreshTokenSchema,
};