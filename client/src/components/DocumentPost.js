import React, { useState } from 'react';
import axios from 'axios';
import './DocumentPost.css'; 

function DocumentPost({ groupId, onPostSuccess }) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('tags', tags);

    try {
      await axios.post(`/groups/${groupId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDescription('');
      setTags('');
      setFile(null);
      onPostSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="document-post">
      <h3>Share a Document</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this document about?"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Add tags (comma separated)"
        />
        <input
          type="file"
          onChange={handleFileChange}
        />
        <button type="submit">Share Document</button>
      </form>
    </div>
  );
}

export default DocumentPost;