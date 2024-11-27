import React, { useEffect, useState } from 'react';
import { baseUrl } from '../Config';

const PromptUpdate = ({ onClose }) => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedKey, setStoredKey] = useState(null);
  const [error, setError] = useState(null);

  const fetchStoredKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStoredKey(data.prompt || null);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch stored prompt');
        setStoredKey(null);
      }
    } catch (error) {
      console.error('Error fetching stored key:', error);
      setError('Network error. Please check your connection.');
      setStoredKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompts: value })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update prompt');
      }

      alert('Prompt Updated Successfully');
      await fetchStoredKey(); // Refresh stored key
      setError(null);
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePrompt = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Prompt successfully removed!');
        await fetchStoredKey(); // Refresh stored key status
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove Prompt');
      }
    } catch (error) {
      console.error('Error removing key:', error);
      setError(error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredKey();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-[800px] max-w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Update Prompt</h2>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <textarea 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
        className='border p-3 w-full outline-none h-96 overflow-auto mb-4' 
        placeholder={value === '' ? (storedKey || 'Enter your prompt') : ''} 
      />

      <div className="flex space-x-4">
        <button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className='bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50'
        >
          {isLoading ? 'Updating...' : 'Update Prompt'}
        </button>
        <button 
          onClick={handleRemovePrompt} 
          disabled={isLoading}
          className='bg-red-500 text-white p-3 rounded hover:bg-red-600 disabled:opacity-50'
        >
          {isLoading ? 'Removing...' : 'Delete Prompt'}
        </button>
      </div>
    </div>
  );
};

export default PromptUpdate;