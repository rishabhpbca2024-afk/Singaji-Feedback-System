const Question = require('../models/Question');

// @desc    Get all questions
// @route   GET /api/questions
const getAllQuestions = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    const questions = await Question.find(filter).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Get questions error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a question
// @route   POST /api/questions
const createQuestion = async (req, res) => {
  try {
    const {
      text,
      category,
      status,
    } = req.body;

    // Question text required
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required',
      });
    }

    // Category required
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    // Convert frontend status into database boolean
    const isActive = status === 'Active';

    // Find the last question from all categories
    const lastQuestion = await Question.findOne().sort({
      order: -1,
    });

    // Generate next global order automatically
    const newOrder = lastQuestion
      ? lastQuestion.order + 1
      : 1;

    // Create question
    const question = await Question.create({
      text,
      category,
      isActive,
      order: newOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question,
    });

  } catch (error) {
    console.error('Create question error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, category, status } = req.body;

    // Existing question find karo
    const existingQuestion = await Question.findById(id);

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Status ko frontend ke string se database ke boolean mein convert karo
    const isActive = status === 'Active';

    // Question update karo
    // Order ko same rakhenge
    const question = await Question.findByIdAndUpdate(
      id,
      {
        text,
        category,
        isActive,
        order: existingQuestion.order,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    console.error('Update question error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find question
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // 2. Delete question
    await Question.findByIdAndDelete(id);

    // 3. Get all remaining questions
    const remainingQuestions = await Question.find().sort({
      order: 1,
      createdAt: 1,
    });

    // 4. Re-arrange global order: 1, 2, 3, 4...
    for (let i = 0; i < remainingQuestions.length; i++) {
      remainingQuestions[i].order = i + 1;
      await remainingQuestions[i].save();
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });

  } catch (error) {
    console.error('Delete question error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};