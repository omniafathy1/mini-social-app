const express = require('express');
const { search } = require('../controllers/search.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, search);

module.exports = router;