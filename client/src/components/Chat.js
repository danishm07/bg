// src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io({withCredentials: true }); // Make sure this matches your server URL

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Join a room
    if (username && room) {
      socket.emit('join room', { username, room });
    }

    // Listen for messages
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('chat message');
      socket.emit('leave room', { username, room });
    };
  }, [username, room]);

  useEffect(() => {
    // Scroll to bottom of chat container when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage && username && room) {
      socket.emit('chat message', { text: inputMessage, username, room });
      setInputMessage('');
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (username && room) {
      socket.emit('join room', { username, room });
    }
  };

  return (
    <div>
      <h2>Chat Room</h2>
      {!username && (
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
            required
          />
          <button type="submit">Join Room</button>
        </form>
      )}
      {username && room && (
        <>
          <div ref={chatContainerRef} style={{ height: '300px', overflowY: 'scroll' }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.username}: </strong>
                {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
}

export default Chat;