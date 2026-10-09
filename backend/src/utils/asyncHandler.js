// asyncHandler بيلف أي async function (زي أي controller) وبيمسك أي error يحصل جواها
// من غير ما نكتب try/catch في كل controller لوحده.
// لو حصل error جوه الدالة، بيتبعت مباشرة للـ error handler العام في app.js عن طريق next(error)

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;