import React, { useState } from 'react';
import axios from 'axios';

const TextProcessor = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/study/process/text', {
        text,
        title
      });

      setResult(response.data);
      setText('');
      setTitle('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Enter a title for your notes"
          />
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Text Content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Paste or type your text here..."
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : 'Process Text'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Summary Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Summary</h3>
            <p className="mt-2 text-gray-600">{result.summary}</p>
          </div>

          {/* Key Points Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Key Points</h3>
            <ul className="mt-2 list-disc list-inside space-y-2">
              {result.keyPoints.map((point, index) => (
                <li key={index} className="text-gray-600">{point}</li>
              ))}
            </ul>
          </div>

          {/* Flashcards Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Flashcards</h3>
            <div className="mt-4 space-y-4">
              {result.flashcards.map((card, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <p className="font-medium">Q: {card.question}</p>
                  <p className="mt-2 text-gray-600">A: {card.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Stats</h3>
            <dl className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Word Count</dt>
                <dd className="text-lg font-medium">{result.metadata.wordCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Reading Time</dt>
                <dd className="text-lg font-medium">{result.metadata.readingTime} min</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextProcessor;