const express = require('express');
const { loginLimiter } = require("../middleware/Ratelimiter");
const { Login } = require('../controllers/authController');

const router = express.Router();

router.post("/login", loginLimiter, Login);

module.exports = router;