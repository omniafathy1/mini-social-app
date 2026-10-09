// الملف ده مسؤوليته حاجة واحدة بس: يعمل "driver" واحد للاتصال بالداتابيز (CognoDB / Neo4j)
// وأي مكان تاني في المشروع محتاج يتكلم مع الداتابيز هياخد الـ driver ده من هنا
// (بدل ما كل ملف يعمل اتصال جديد لوحده)

const neo4j = require("neo4j-driver");

const NEO4J_URI = process.env.COGNODB_URI;
const NEO4J_USERNAME = process.env.COGNODB_USERNAME;
const NEO4J_PASSWORD = process.env.COGNODB_PASSWORD;

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.warn(
    "⚠️  تنبيه: متغيرات الداتابيز (NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD) مش متظبطة في ملف .env"
  );
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

module.exports = driver;

