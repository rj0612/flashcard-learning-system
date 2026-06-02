const express = require('express');
const ViewHistory = require('../models/ViewHistory');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    const history = await ViewHistory.find({ user: req.user._id })
      .populate('flashcard', 'question category studied')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch learning history' });
  }
});

router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const query = req.query.userId ? { user: req.query.userId } : {};
    const history = await ViewHistory.find(query)
      .populate('user', 'name email role')
      .populate('flashcard', 'question category studied')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin history' });
  }
});

router.delete('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const result = await ViewHistory.deleteMany({});
    res.json({ message: 'All learning history records deleted', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete all learning history records' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const deleted = await ViewHistory.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'History record not found' });
    res.json({ message: 'History record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete history record' });
  }
});

module.exports = router;
