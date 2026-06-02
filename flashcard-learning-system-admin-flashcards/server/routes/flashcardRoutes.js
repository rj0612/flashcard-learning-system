const express = require('express');
const Flashcard = require('../models/Flashcard');
const ViewHistory = require('../models/ViewHistory');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

async function logHistory(userId, card, action) {
  try {
    await ViewHistory.create({
      user: userId,
      flashcard: card._id,
      action,
      snapshotQuestion: card.question,
      snapshotCategory: card.category
    });
  } catch (error) {
    console.error('History log failed:', error.message);
  }
}

// All logged-in users can read the shared flashcard bank.
router.get('/', protect, async (req, res) => {
  try {
    const { search = '', category = '', studied = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = { $regex: `^${category}$`, $options: 'i' };
    if (studied === 'true') query.studied = true;
    if (studied === 'false') query.studied = false;

    const cards = await Flashcard.find(query).sort({ category: 1, createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flashcards' });
  }
});

// Only admins can create flashcards.
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer are required' });

    const card = await Flashcard.create({
      question,
      answer,
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      owner: req.user._id
    });
    await logHistory(req.user._id, card, 'created');
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create flashcard' });
  }
});

// Only admins can edit flashcards.
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Flashcard not found' });

    card.question = req.body.question ?? card.question;
    card.answer = req.body.answer ?? card.answer;
    card.category = req.body.category || card.category;
    card.difficulty = req.body.difficulty || card.difficulty;
    await card.save();
    await logHistory(req.user._id, card, 'updated');
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update flashcard' });
  }
});

// Students and admins can update study status when using the study interface.
router.patch('/:id/studied', protect, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Flashcard not found' });

    card.studied = Boolean(req.body.studied);
    await card.save();
    await logHistory(req.user._id, card, card.studied ? 'marked_studied' : 'moved_to_active');
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update study status' });
  }
});

router.post('/:id/view', protect, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Flashcard not found' });
    await logHistory(req.user._id, card, 'viewed_answer');
    res.json({ message: 'View recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record view' });
  }
});

// Only admins can delete flashcards.
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Flashcard not found' });
    await logHistory(req.user._id, card, 'deleted');
    await card.deleteOne();
    res.json({ message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete flashcard' });
  }
});

module.exports = router;
