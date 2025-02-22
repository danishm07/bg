import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Plus, Copy, Edit2, LogOut, Users } from 'lucide-react';

function ChatRooms() {
  const [rooms, setRooms] = useState([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/chat-rooms', { withCredentials: true });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setError('Please log in to access chat rooms.');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    try {
      const response = await axios.post('/chat-rooms');
      navigate(`/chat-room/${response.data._id}`);
    } catch (error) {
      setError('Failed to create chat room. Please try again.');
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/chat-rooms/${joinRoomId}/join`);
      navigate(`/chat-room/${joinRoomId}`);
    } catch (error) {
      setError('Failed to join chat room. Please check the room ID.');
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      await axios.post(`/chat-rooms/${roomId}/leave`);
      setRooms(rooms.filter(room => room._id !== roomId));
    } catch (error) {
      setError('Failed to leave chat room. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-tertiary">
        <div className="loading-spinner">Loading chat rooms...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold flex items-center">
          <MessageCircle className="mr-2 icon-blue" />
          Your Chat Rooms
        </h2>
        <button
          onClick={createRoom}
          className="primary-button flex items-center"
        >
          <Plus size={16} className="mr-1" />
          New Chat Room
        </button>
      </div>

      {error && (
        <div className="error-message mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        <form onSubmit={joinRoom} className="p-4 border-b border-border-light bg-background-tertiary">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Enter Room ID to Join"
              className="flex-1 px-3 py-2 border border-border-dark rounded-md text-sm"
            />
            <button type="submit" className="secondary-button">
              Join Room
            </button>
          </div>
        </form>

        {rooms.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <Users className="w-12 h-12 mx-auto mb-3 text-text-muted" />
            <p className="mb-2">No chat rooms yet</p>
            <p className="text-sm">Create a new room or join an existing one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {rooms.map(room => (
              <div key={room._id} className="p-4 hover:bg-background-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/chat-room/${room._id}`}
                    className="flex-1 flex items-center"
                  >
                    <div className="mr-4">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center icon-${['blue', 'green', 'orange', 'purple', 'pink'][Math.floor(Math.random() * 5)]}`}>
                        <MessageCircle size={20} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{room.name || `Room ${room._id.slice(-4)}`}</h3>
                      <p className="text-sm text-text-secondary">
                        {room.participants?.length || 0} participants
                      </p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(room._id)}
                      className="icon-button"
                      title="Copy Room ID"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => leaveRoom(room._id)}
                      className="icon-button text-red"
                      title="Leave Room"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatRooms;