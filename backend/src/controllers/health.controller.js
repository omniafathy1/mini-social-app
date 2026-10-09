const driver = require("../config/db");

// GET /api/test-db
async function testDb(req, res) {
  const session = driver.session();

  try {
    const result = await session.run("RETURN 1 AS number");
    const number = result.records[0].get("number");

    res.json({
      message: "CognoDB is working!",
      number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database query failed" });
  } finally {
    await session.close();
  }
}

module.exports = { testDb };