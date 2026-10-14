// Convert Neo4j DateTime values to ISO strings that JavaScript Date can parse.
function toIsoString(neo4jDateTime) {
  if (!neo4jDateTime) return null;

  if (typeof neo4jDateTime === "string") return neo4jDateTime;

  return neo4jDateTime.toStandardDate().toISOString();
}

module.exports = { toIsoString };