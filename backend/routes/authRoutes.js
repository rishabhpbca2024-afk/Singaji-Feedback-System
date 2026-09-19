const express = require('express');
const { loginAccountLimiter,loginIpLimiter } = require("../middleware/Ratelimiter");
const { Login } = require('../controllers/authController');

const router = express.Router();

router.post("/login", loginAccountLimiter,loginIpLimiter, Login);

module.exports = router;