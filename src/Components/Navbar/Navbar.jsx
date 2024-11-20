import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import { baseUrl } from '../Config';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [setError] = useState();

  const handleLogout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post(`${baseUrl}/api/logout`);

      if (response.data.status === 'success') {
        localStorage.clear();
        navigate('/');
      } else {
        setError('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('An error occurred during logout');
    }
  };

  return (
    <nav className="bg-white border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img src='/Images/firstdraftlogowithbackground.png' className='w-10 rounded' alt="Logo" />
            </div>
            <div className="ml-4 flex space-x-8">
              <Link 
                to="/home" 
                className={`text-sm font-medium cursor-pointer ${location.pathname === '/home' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                GENERATE DOCUMENT
              </Link>
              <Link 
                to="/my-documents" 
                className={`text-sm font-medium cursor-pointer ${location.pathname === '/my-documents' ? 'text-blue-600' : 'text-gray-500'}`}
                title='My Documents'
              >
                MY DOCUMENTS
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};


