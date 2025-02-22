import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { File, Download, Tag, User, Calendar, Upload, MessageSquare, ThumbsUp, X, LogOut, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import CodeShare from './CodeShare';
import './GroupStyles.css';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('javascript', js);

const DocumentUpload = ({ groupId, onPostSuccess }) => {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('description', description);
    formData.append('tags', tags);

    try {
      await axios.post(`/api/groups/${groupId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDescription('');
      setTags('');
      setFile(null);
      onPostSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-2xl font-bold mb-4">Share a Document or Post</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Add tags (comma separated)"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-500 transition duration-300">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <div>
              <Upload className="mx-auto h-12 w-12 text-gray-600" />
              <p className="h-12 w-12 text-gray-600">Drag 'n' drop a file here, or click to select a file</p>
            </div>
          )}
          {file && <p className="mt-2 text-sm text-gray-600">{file.name}</p>}
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => document.querySelector('input[type="file"]').click()}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-300"
          >
            Upload File
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

const FilePreview = ({ file, onClose }) => {
  const isImage = file.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);
  const isVideo = file.fileUrl.match(/\.(mp4|webm|ogg)$/i);
  const isPdf = file.fileUrl.match(/\.pdf$/i);

  return (
    <div className="file-preview">
      <button onClick={onClose} className="preview-close">
        <X size={16} />
      </button>
      {isImage && <img src={file.fileUrl} alt={file.fileName} />}
      {isVideo && (
        <video controls>
          <source src={file.fileUrl} type={`video/${file.fileUrl.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
      )}
      {isPdf && (
        <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`}
                frameBorder="0"></iframe>
      )}
      {!isImage && !isVideo && !isPdf && <p>Preview not available for this file type.</p>}
    </div>
  );
};

const PostItem = ({ post, previewFile, onTogglePreview }) => {
  const [showCodePreview, setShowCodePreview] = useState(false);

  const renderCodePreview = () => {
    if (!showCodePreview) return null;
    
    return (
      <div className="code-preview-container">
        <div className="code-preview-header">
          <span>{post.language || 'JavaScript'}</span>
          <button 
            onClick={() => setShowCodePreview(false)} 
            className="preview-close"
          >
            <X size={16} />
          </button>
        </div>
        <SyntaxHighlighter 
          language={post.language || 'javascript'}
          style={githubGist}
          customStyle={{
            padding: '1rem',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#f8f9fc',
            margin: 0
          }}
        >
          {post.content || post.description}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="message-block bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg relative">
      <div className="flex items-center mb-4">
        <File className="w-8 h-8 mr-3 text-blue-500" />
        <div>
          <h4 className="text-xl font-semibold text-primary">
            {post.type === 'code' ? 'Code Snippet' : (post.fileName || 'Text Post')}
          </h4>
          <p className="text-sm text-secondary">{post.description}</p>
        </div>
      </div>

      {/* Code Preview Button */}
      {post.type === 'code' && (
        <div className="flex justify-between mb-4">
          <button
            onClick={() => setShowCodePreview(!showCodePreview)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
          >
            {showCodePreview ? 'Hide Code' : 'Show Code'}
          </button>
        </div>
      )}

      {/* Code Preview */}
      {post.type === 'code' && renderCodePreview()}

      {/* Regular File Preview */}
      {post.fileUrl && (
        <div className="flex justify-between mb-4">
          <button
            onClick={() => onTogglePreview(post)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
          >
            {previewFile && previewFile._id === post._id ? 'Hide Preview' : 'Show Preview'}
          </button>
          <a
            href={post.fileUrl}
            download
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags && post.tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-secondary mb-4">
        <span className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          {post.uploadedBy?.username}
        </span>
        <span className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex justify-between text-secondary">
        <button className="flex items-center hover:text-blue-500 transition duration-300">
          <ThumbsUp className="w-4 h-4 mr-1" />
          Like
        </button>
        <button className="flex items-center hover:text-blue-500 transition duration-300">
          <MessageSquare className="w-4 h-4 mr-1" />
          Comment
        </button>
      </div>
      
      {previewFile && previewFile._id === post._id && (
        <FilePreview file={post} onClose={() => onTogglePreview(null)} />
      )}
    </div>
  );
};

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [previewFile, setPreviewFile] = useState(null);
  const [activeTag, setActiveTag] = useState('All');
  const [allTags, setAllTags] = useState(['All']);

  const fetchGroupData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const groupResponse = await axios.get(`/api/groups/${groupId}`);
      setGroup(groupResponse.data);
      const postsResponse = await axios.get(`/api/groups/${groupId}/posts`);
      setPosts(postsResponse.data);
      
      // Extract all unique tags
      const tags = new Set(postsResponse.data.flatMap(post => post.tags));
      setAllTags(['All', ...Array.from(tags)]);
    } catch (error) {
      console.error('Error fetching group data:', error);
      setError('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await axios.post(`/api/groups/${groupId}/leave`);
        navigate('/groups');
      } catch (error) {
        console.error('Error leaving group:', error);
        setError('Failed to leave group. Please try again.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/groups/${groupId}`);
        navigate('/groups');
      } catch (error) {
        console.error('Error deleting group:', error);
        setError('Failed to delete group. Please try again.');
      }
    }
  };

  const togglePreview = (post) => {
    setPreviewFile(prevFile => prevFile && prevFile._id === post._id ? null : post);
  };

  const filteredPosts = activeTag === 'All'
    ? posts
    : posts.filter(post => post.tags.includes(activeTag));

  if (loading) return <div className="flex justify-center items-center h-screen">Loading group data...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!group) return <div className="text-center p-4">Group not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-primary">{group.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleLeaveGroup}
            className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition duration-300 flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" /> Leave Group
          </button>
          {group.creator._id === user.id && (
            <button
              onClick={handleDeleteGroup}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Group
            </button>
          )}
        </div>
      </div>
      <CodeShare groupId={groupId} onPostSuccess={fetchGroupData} />
      <DocumentUpload groupId={groupId} onPostSuccess={fetchGroupData} />
      
      <div className="tag-filter">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`tag-filter-button ${activeTag === tag ? 'active' : ''}`}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        {filteredPosts.map(post => (
          <PostItem 
            key={post._id} 
            post={post} 
            previewFile={previewFile} 
            onTogglePreview={togglePreview} 
          />
        ))}
      </div>
    </div>
  );
}

export default GroupDetail;