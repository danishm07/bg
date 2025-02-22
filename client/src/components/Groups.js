import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, Users, Hash } from 'lucide-react';
import './GroupStyles.css';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/groups');
      setGroups(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/groups', { name: newGroupName });
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/groups/join', { code: joinCode });
      setJoinCode('');
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please check the code and try again.');
    }
  };

  if (loading) return <div className="text-center py-8">Loading groups...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-primary">Your Groups</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {groups.map(group => (
          <Link key={group._id} to={`/group/${group._id}`} className="block">
            <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg hover:transform hover:scale-105">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Hash className="mr-2 text-blue-500" />
                {group.name}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Users className="mr-2" />
                {group.members.length} members
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={createGroup} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New Group Name"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </form>
        <form onSubmit={joinGroup} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Join Group</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Group Code"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <button type="submit" className="w-full bg-green-500 text-white py-3 rounded-md hover:bg-green-600 transition duration-300 flex items-center justify-center">
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </button>
        </form>
      </div>
    </div>
  );
}

export default Groups;