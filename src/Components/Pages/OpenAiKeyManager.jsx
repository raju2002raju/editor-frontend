import { useState, useEffect } from 'react';
import './OpenAiKeyManager.css';
import { baseUrl } from '../Config';

const OpenAiKeyManager = () => {
  const [apiKey, setApiKey] = useState(''); // Holds the input OpenAI key
  const [storedKey, setStoredKey] = useState(null); // Tracks if a key is saved
  const [isLoading, setIsLoading] = useState(false); // To manage loading states

  // Check if the key exists on the backend
  const fetchStoredKey = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setStoredKey(data.key || null); // Update state with the fetched key
      } else {
        setStoredKey(null);
      }
    } catch (error) {
      console.error('Error fetching stored key:', error);
      setStoredKey(null);
    }
  };

  // Save the key
  const handleSaveKey = async () => {
    try {
      if (!apiKey.trim()) {
        alert('Please provide a valid OpenAI key.');
        return;
      }

      setIsLoading(true); // Start loading
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: apiKey }),
      });

      if (response.ok) {
        alert('OpenAI key successfully saved!');
        await fetchStoredKey(); // Refresh stored key status
        setApiKey(''); // Clear the input field after saving
      } else {
        const errorData = await response.json();
        console.error('Error saving key:', errorData);
        alert('Failed to save OpenAI key. Please try again.');
      }
    } catch (error) {
      console.error('Error occurred:', error);
      alert('An unexpected error occurred. Please check your network connection.');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Remove the key
  const handleRemoveKey = async () => {
    try {
      setIsLoading(true); // Start loading
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('OpenAI key successfully removed!');
        await fetchStoredKey(); // Refresh stored key status
      } else {
        const errorData = await response.json();
        console.error('Error removing key:', errorData);
        alert('Failed to remove OpenAI key. Please try again.');
      }
    } catch (error) {
      console.error('Error occurred:', error);
      alert('An unexpected error occurred. Please check your network connection.');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Check the key on mount
  useEffect(() => {
    fetchStoredKey();
  }, []);

  return (
    <div className="flex flex-col items-end gap-4">
      {/* Input field for entering the OpenAI key */}
      <input
        type="text"
        className="input-field"
        placeholder="Enter OpenAI key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      {/* Action buttons */}
      <div className="flex justify-end">
        <button
          className="btn save-btn"
          onClick={handleSaveKey}
          disabled={!apiKey.trim() || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          className="btn remove-btn"
          onClick={handleRemoveKey}
          disabled={!storedKey || isLoading}
        >
          {isLoading ? 'Removing...' : 'Remove'}
        </button>
      </div>

      {/* Display the stored key (optional) */}
      {storedKey && (
        <p className="text-sm text-gray-600 w-[470px] overflow-y-auto">
          Saved Key: <span className="font-bold">{storedKey}</span>
        </p>
      )}
    </div>
  );
};

export default OpenAiKeyManager;
