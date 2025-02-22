import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { File, Upload, BookOpen, Download, Tag } from 'lucide-react';
import axios from 'axios';

function StudyHub() {
  const [activeTab, setActiveTab] = useState('upload'); // upload, library, summary, flashcards
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studyContent, setStudyContent] = useState([]);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/study/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setStudyContent(prev => [...prev, response.data]);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'upload' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Upload Content
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'library' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          My Library
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Upload Study Material</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition duration-200 ease-in-out ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the file here ...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag and drop a file here, or click to select</p>
                <p className="text-sm text-gray-500">Supports PDF and TXT files</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing your file...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">My Study Materials</h2>
          {studyContent.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No study materials yet. Upload something to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyContent.map((content, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <File className="h-5 w-5 mr-2 text-blue-500" />
                    <h3 className="font-semibold">{content.title}</h3>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-blue-500 hover:text-blue-600">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudyHub;