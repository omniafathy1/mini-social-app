const neo4j = require("neo4j-driver");
const driver = require("../config/db");
const { toIsoString } = require("../utils/formatDate");

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const RESULTS_LIMIT = 8;

// GET /api/search?q=...
async function search(req, res) {
  // Reject repeated query parameters, which Express parses as an array.
  const rawQuery = typeof req.query.q === "string" ? req.query.q : "";

  // Trim whitespace and cap the query length.
  const q = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  if (q.length < MIN_QUERY_LENGTH) {
    return res.status(400).json({
      message: `Search query must be at least ${MIN_QUERY_LENGTH} characters`
    });
  }

  const session = driver.session();

  try {
    // Parameterize the query to prevent Cypher injection; search names only to protect email privacy.
    const usersResult = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.name) CONTAINS toLower($q)
      RETURN u
      ORDER BY u.name ASC
      LIMIT $limit
      `,
      { q, limit: neo4j.int(RESULTS_LIMIT) }
    );

    const postsResult = await session.run(
      `
      MATCH (author:User)-[:CREATED]->(p:Post)
      WHERE toLower(p.content) CONTAINS toLower($q)
      RETURN p, author
      ORDER BY p.createdAt DESC
      LIMIT $limit
      `,
      { q, limit: neo4j.int(RESULTS_LIMIT) }
    );

    // Return only public user fields.
    const users = usersResult.records.map((record) => {
      const user = record.get("u");
      return {
        id: user.properties.id,
        name: user.properties.name,
        avatarUrl: user.properties.avatarUrl || null
      };
    });

    const posts = postsResult.records.map((record) => {
      const post = record.get("p");
      const author = record.get("author");
      return {
        id: post.properties.id,
        content: post.properties.content,
        imageUrl: post.properties.imageUrl || null,
        createdAt: toIsoString(post.properties.createdAt),
        user: {
          id: author.properties.id,
          name: author.properties.name,
          avatarUrl: author.properties.avatarUrl || null
        }
      };
    });

    res.json({ users, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search failed" });
  } finally {
    await session.close();
  }
}

module.exports = { search };