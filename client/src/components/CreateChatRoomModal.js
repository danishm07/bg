// src/components/CreateChatRoomModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateChatRoomModal.css';


function CreateChatRoomModal({ isOpen, onClose }) {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/chat-rooms', { name: roomName }, { withCredentials: true });
      onClose();
      navigate(`/chat-room/${response.data._id}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Chat Room</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            required
          />
          <button type="submit">Create</button>
        </form>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
  },
};

export default CreateChatRoomModal;