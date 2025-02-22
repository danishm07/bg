import React, { useState } from 'react';
import axios from 'axios';
import { Editor } from '@monaco-editor/react';
import { ChevronDown, Copy, Code2 } from 'lucide-react';

function CodeShare({ groupId, onPostSuccess }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/groups/${groupId}/code`, {
        title: title || 'Code Snippet',
        description,
        code,
        language,
        tags: [], // Add tags if you want to support them
        type: 'code' // Explicitly set the type
      });

      setCode('');
      setTitle('');
      setDescription('');
      setIsExpanded(false);
      
      // Call the success callback to refresh the posts
      if (onPostSuccess) {
        onPostSuccess();
      }
    } catch (error) {
      console.error('Error posting code:', error);
      setError(error.response?.data?.message || 'Failed to post code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="code-share-container">
      <button 
        className="code-share-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Code2 className="icon" />
        Share Code
        <ChevronDown className={`icon ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="code-share-form">
          {error && (
            <div className="error-message mb-4">
              {error}
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="code-title-input"
          />
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="code-description-input"
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select mb-4"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            {/* Add more language options as needed */}
          </select>

          <div className="code-editor-wrapper">
            <Editor
              height="300px"
              language={language}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="submit-button"
            >
              {isSubmitting ? 'Posting...' : 'Share Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CodeShare;