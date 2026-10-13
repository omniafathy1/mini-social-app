// validate(schema) بترجع middleware جاهز يتحقق من req.body على حسب أي schema نديله
// الفكرة إننا نعيد استخدام الدالة دي مع أي endpoint، مش نكررها لكل route لوحده
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // result.error.issues فيها تفاصيل كل حقل غلط وليه
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    // بنستبدل req.body بالنسخة "النضيفة" اللي zod رجعها (بعد trim مثلاً)
    req.body = result.data;
    next();
  };
}

module.exports = validate;