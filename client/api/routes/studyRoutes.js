const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyContent = require('../models/StudyContent');
const upload = require('../middleware/upload');
const studyContentService = require('../services/studyContentService');
const axios = require('axios');
const pythonService = require('../services/pythonService');

// Process uploaded file
router.post('/process', 
  auth.isAuthenticated, 
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const studyContent = await studyContentService.processFile(req.file, req.user._id);
      res.status(201).json(studyContent);
    } catch (error) {
      console.error('Error processing study content:', error);
      if (error.message.includes('Only PDF files are allowed')) {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
      }
      res.status(500).json({ message: 'Error processing study content', error: error.message });
    }
});

// Get study content for user
router.get('/', 
  auth.isAuthenticated, 
  async (req, res) => {
    try {
      const content = await StudyContent.find({ owner: req.user._id })
        .sort({ createdAt: -1 });
      res.json(content);
    } catch (error) {
      console.error('Error fetching study content:', error);
      res.status(500).json({ message: 'Error fetching study content', error: error.message });
    }
});

// Get specific study content
router.get('/:id', 
  auth.isAuthenticated, 
  async (req, res) => {
    try {
      const content = await StudyContent.findOne({
        _id: req.params.id,
        owner: req.user._id
      });
      if (!content) {
        return res.status(404).json({ message: 'Study content not found' });
      }
      res.json(content);
    } catch (error) {
      console.error('Error fetching study content:', error);
      res.status(500).json({ message: 'Error fetching study content', error: error.message });
    }
});


router.post('/process/text', auth.isAuthenticated, async (req, res) => {
  try {
    const { text, summary_length, generate_flashcards } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'No text provided' });
    }

    const response = await axios.post(`${pythonService.getBaseUrl()}/process/text`, {
      text,
      summary_length: parseInt(summary_length),
      generate_flashcards: Boolean(generate_flashcards)
    });

    const studyContent = new StudyContent({
      title: 'Text Analysis',
      owner: req.user._id,
      originalContent: {
        type: 'text',
        content: text
      },
      processedContent: {
        summary: response.data.summary,
        keyPoints: response.data.key_points,
        statistics: response.data.metadata
      },
      flashcards: response.data.flashcards,
      status: 'completed'
    });

    await studyContent.save();
    res.json(response.data);
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ 
      message: 'Error processing text', 
      error: error.message 
    });
  }
});

module.exports = router;