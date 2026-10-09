const express = require("express");
const router = express.Router();

const { testDb } = require("../controllers/health.controller");

router.get("/test-db", testDb);

module.exports = router;