// Validate request bodies with a Zod schema and return structured field errors.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    // Use parsed data so schema transformations are reflected in the request.
    req.body = result.data;
    next();
  };
}

module.exports = validate;