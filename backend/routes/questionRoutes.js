const express = require('express');
const { protect,authorize } = require("../middleware/authMiddleware");

const {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');

const router = express.Router();

router.get('/',getAllQuestions);

router.post('/create', protect, authorize("Admin"), createQuestion);

router.put('/:id', protect, authorize("Admin"), updateQuestion);

router.delete('/:id', protect, authorize("Admin"), deleteQuestion);

module.exports = router;