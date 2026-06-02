const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flashcard: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', required: true },
    action: {
      type: String,
      enum: ['created', 'viewed_answer', 'marked_studied', 'moved_to_active', 'updated', 'deleted'],
      required: true
    },
    snapshotQuestion: { type: String, default: '' },
    snapshotCategory: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ViewHistory', viewHistorySchema);
