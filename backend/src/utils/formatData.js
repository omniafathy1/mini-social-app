// Neo4j بيرجع القيم اللي عملناها بـ datetime() كـ object خاص بيه (مش نص عادي)
// وده بيبوظ new Date(...) في الفرونت. الدالة دي بتحوله لنص ISO عادي زي:
// "2026-09-20T10:30:00.000Z" — الشكل اللي new Date() في جافاسكريبت بيفهمه من غير مشاكل
function toIsoString(neo4jDateTime) {
  if (!neo4jDateTime) return null;

  // لو جاية بالفعل نص (احتياطًا)، رجعها زي ما هي
  if (typeof neo4jDateTime === "string") return neo4jDateTime;

  // neo4jDateTime.toStandardDate() بترجع كائن Date عادي بتاع جافاسكريبت
  return neo4jDateTime.toStandardDate().toISOString();
}

module.exports = { toIsoString };