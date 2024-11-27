import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../Navbar/Navbar';
import { baseUrl } from '../Config';

const MyDocument = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentClick = async (docId, docName) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/documents/${docId}`);
      navigate('/', {
        state: {
          documentContent: response.data.content,
          documentName: docName,
          documentId: docId
        }
      });
    } catch (error) {
      console.error('Error fetching document content:', error);
      alert('Error loading document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${baseUrl}/api/documents/${docId}`);
        setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== docId));
        alert('Document deleted successfully.');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document: ' + error.message);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="documents-container">
        <h3>Documents</h3>
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <ul className="documents-list">
            {documents.map(doc => (
              <li key={doc._id} className="document-item">
                <button
                  onClick={() => handleDocumentClick(doc._id, doc.name)}
                  className="document-button"
                >
                  {doc.name || 'Untitled Document'}
                </button>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="document-button delete-button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyDocument;
