// Reuse one Neo4j driver across the application.

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
