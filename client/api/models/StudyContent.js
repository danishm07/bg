const mongoose = require('mongoose');

const studyContentSchema = new mongoose.Schema({
  title: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalContent: {
    type: {
      type: String,
      enum: ['pdf', 'text'],
      required: true
    },
    content: String,  // For text content
    fileUrl: String   // For PDF files
  },
  summary: String,
  keyPoints: [String],
  flashcards: [{
    question: String,
    answer: String,
    topic: String,
    difficulty: { type: Number, default: 1 }
  }],
  metadata: {
    wordCount: Number,
    readingTime: Number,
    sentenceCount: Number,
    pageCount: Number     // For PDFs only
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StudyContent = mongoose.model('StudyContent', studyContentSchema);
module.exports = StudyContent;