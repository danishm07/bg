// ChatRoom.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';


import path from 'path-browserify';
import './ChatRoom.css';
import api from '../api';
import { useSwipeable } from 'react-swipeable';
import { Edit2, Trash2, X, Send } from 'lucide-react';



const userColors = ['user-color-1', 'user-color-2', 'user-color-3']; // Add more colors as needed

function ChatRoom({ deviceType }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const images = messages.filter(msg => msg.fileType && msg.fileType.startsWith('image/')).map(msg => msg.fileUrl);
  const [chatRooms, setChatRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [room] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [userColorMap, setUserColorMap] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(true);


  const scrollToBottom = (behavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  


  const editRoomName = async (roomId, newName) => {
    try {
      await axios.put(`/chat-rooms/${roomId}`, { name: newName }, { withCredentials: true });
      // Refresh room list or update state
    } catch (error) {
      console.error('Error updating room name:', error);
    }
  };
  
  const leaveRoom = async (roomId) => {
    try {
      await axios.post(`/chat-rooms/${roomId}/leave`, {}, { withCredentials: true });
      // Navigate away or remove from list
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  

  const handleEditMessage = (messageId, newContent) => {
    socketRef.current.emit('edit message', {
      room: roomId,
      messageId,
      newMessage: newContent
    });
    setEditingMessage(null);
  };

  const handleDeleteMessage = (messageId) => {
    socketRef.current.emit('delete message', {
      room: roomId,
      messageId
    });
  };

  const assignUserColor = useCallback((username) => {
    setUserColorMap((prevColors) => {
      if (!prevColors[username]) {
        const colorIndex = Object.keys(prevColors).length % userColors.length;
        return {
          ...prevColors,
          [username]: userColors[colorIndex],
        };
      }
      return prevColors;
    });
  }, []);

  

  useEffect(() => {
    socketRef.current = io({ withCredentials: true });

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/chat-rooms/${roomId}/messages`);
        setMessages(response.data);
        setRoomName(response.data.name);
        response.data.forEach((msg) => assignUserColor(msg.user));
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    
  
    fetchMessages();


    socketRef.current.emit('join room', roomId);

    socketRef.current.on('chat message', (msg) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, msg];
        setTimeout(scrollToBottom, 100);
        assignUserColor(msg.user);
        return updatedMessages;
      });
    });
    
    socketRef.current.on('message edited', (editedMessage) => {
      setMessages(prevMessages => prevMessages.map(msg => 
        msg._id === editedMessage._id ? editedMessage : msg
      ));
    });

    socketRef.current.on('message deleted', (deletedMessage) => {
      setMessages(prevMessages => prevMessages.map(msg => 
        msg._id === deletedMessage._id ? deletedMessage : msg
      ));
    });

  


    socketRef.current.on('message error', (error) => {
      console.error('Message error:', error);
      // Handle the error, maybe show a notification to the user
    });

    const scrollToBottom = () => {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    };

    return () => {
      socketRef.current.emit('leave room', roomId);
      socketRef.current.off('chat message');
      socketRef.current.off('message error');
      socketRef.current.off('message deleted');
      socketRef.current.disconnect();
    };


    
  }, [roomId, assignUserColor]);

  
  

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage && user) {
      socketRef.current.emit('chat message', {
        room: roomId,
        user: user.username,
        message: inputMessage
      });
      setInputMessage('');
      scrollToBottom();
    }
  };

  
 
  const handleLeaveRoom = async () => {
    try {
      await axios.post(`/chat-rooms/${roomId}/leave`, {}, { withCredentials: true });
      navigate('/chat-rooms');
    } catch (error) {
      console.error('Error leaving room:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      
      const messageData = {
        room: roomId,
        user: user.username,
        message: "...", 
        fileUrl: response.data.fileUrl,
        fileType: file.type,
        fileName: file.name
      };
  
      socketRef.current.emit('chat message', messageData);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Add user feedback for upload error
      alert('Failed to upload file. Please try again.');
    }
  };
  

  const fetchChatRooms = async () => {
    try {
      console.log('Fetching chat rooms...');
      const response = await api.get('/chat-rooms');
      console.log('Chat rooms response:', response.data);
      setChatRooms(response.data);
    } catch (error) {
      console.error('Error fetching chat rooms:', error.response ? error.response.data : error.message);
      //setError('Failed to load chat rooms. Please try again.');
    }
  };


  const renderMessage = (msg) => {
    const isOwnMessage = msg.user === user.username;
    const messageClass = isOwnMessage ? 'message own-message' : 'message other-message';
    const colorStyle = { backgroundColor: userColorMap[msg.user] || '#cccccc' };

    const renderFileContent = () => {
      if (!msg.fileUrl) return null;
  
      if (msg.fileType?.startsWith('image/')) {
        return (
          <div className="file-content">
            <img 
              src={`${msg.fileUrl}`} 
              alt={msg.fileName || 'Shared image'} 
              className="shared-image"
              onClick={() => window.open(msg.fileUrl, '_blank')}
            />
          </div>
        );
      }
  
      if (msg.fileType?.startsWith('video/')) {
        return (
          <div className="file-content">
            <video controls className="shared-video">
              <source src={msg.fileUrl} type={msg.fileType} />
              Your browser doesn't support this video format.
            </video>
          </div>
        );
      }
  
      
      return (
        <div className="file-content">
          <a 
            href={msg.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="file-attachment"
          >
            📎 {msg.fileName || 'Download file'}
          </a>
        </div>
      );
    };
  
    return (
      <div className={`message ${isOwnMessage ? 'message-own' : 'message-other'}`}>
        <div className="message-header">
          <span className="message-user">{msg.user}</span>
          <span className="message-time">
            {new Date(msg.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <div className="message-bubble" >
          {msg.deleted ? (
            <span className="message-deleted">This message has been deleted</span>
          ) : editingMessage === msg._id ? (
            <input
              type="text"
              value={msg.message}
              onChange={(e) => {
                setMessages(prev => prev.map(m => 
                  m._id === msg._id ? { ...m, message: e.target.value } : m
                ));
              }}
              onBlur={() => handleEditMessage(msg._id, msg.message)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEditMessage(msg._id, msg.message);
                }
              }}
              autoFocus
              className="message-edit-input"
            />
          ) : (
            <>
              <div className="message-content" >
                <p>{msg.message}</p>
                {msg.fileUrl && renderFileContent(msg)}
                {msg.editedAt && <span className="message-edited">(edited)</span>}
              </div>
              {isOwnMessage && !msg.deleted && (
                <div className="message-actions">
                  <button onClick={() => setEditingMessage(msg._id)} className="action-button">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteMessage(msg._id)} className="action-button">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-app">
      <div className="chat-room">
        <div className="chat-header">
          <h2>{room.name}</h2>
          <span className="room-id">ID: {roomId}</span>
          <button className="copy-id" onClick={() => navigator.clipboard.writeText(roomId)}>
            Copy ID
          </button>
          <button onClick={() => {
            const newName = prompt('Enter new room name: ');
            if (newName) editRoomName(room._id, newName);
          }}>Edit Name</button>
          <button onClick={() => leaveRoom(room._id)}>Leave Room</button>
          <span className="user-name">Logged in as: {user.username}</span>
        </div>
        <div className="messages-container" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div key={index}>{renderMessage(msg)}</div>
          ))}
        </div>
        <button className="scroll-to-bottom" onClick={scrollToBottom}>↓</button>
        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message"
            className="message-input"
          />
          <button type="submit" className="send-button">
            <i className="fas fa-paper-plane"></i>
          </button>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture={deviceType === 'ios' ? 'camera' : undefined}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <button type="button" onClick={() => fileInputRef.current.click()} className="file-button">
            <i className="fas fa-paperclip"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;