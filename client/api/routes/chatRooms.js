const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const isAuthenticated = require('../middleware/auth'); // Adjust path as needed
const axios = require('axios');

// Get a specific chat room
router.get('/:roomId', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat room', error: error.message });
  }
});

router.get('/', isAuthenticated, async (req, res) => {
    try {
      const rooms = await ChatRoom.find({ participants: req.user._id })
        .select('name _id')  // Include name and _id fields
        .sort({ updatedAt: -1 });
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching chat rooms', error: error.message });
    }
  });

// Update chat room name
router.put('/:roomId', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Optional: Check if the user has permission to edit the room
    // if (room.participants.indexOf(req.user._id) === -1) {
    //   return res.status(403).json({ message: 'You do not have permission to edit this room' });
    // }

    room.name = req.body.name;
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat room', error: error.message });
  }
});

// Leave chat room
router.post('/:roomId/leave', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      participantId => participantId.toString() !== req.user._id.toString()
    );

    // If the room is empty, you might want to delete it
    if (room.participants.length === 0) {
      await ChatRoom.findByIdAndDelete(req.params.roomId);
      return res.json({ message: 'Room deleted as last participant left' });
    }

    await room.save();
    res.json({ message: 'Successfully left the room' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving chat room', error: error.message });
  }
});

module.exports = router;