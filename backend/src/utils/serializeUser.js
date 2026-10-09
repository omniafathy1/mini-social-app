/**
 * Extracts and sanitizes properties from a Neo4j User node.
 * Ensures sensitive data like passwordHash and refreshTokenHash are NEVER leaked.
 */
function serializeUser(userNode) {
  if (!userNode) return null;
  const props = userNode.properties || userNode;

  return {
    id: props.id,
    name: props.name,
    email: props.email,
    avatarUrl: props.avatarUrl || null,
    authProvider: props.authProvider || (props.googleId ? "google" : "local"),
  };
}

module.exports = { serializeUser };