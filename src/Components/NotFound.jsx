import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Large 404 Text */}
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        
        {/* Error Messages */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            Oops! Page not found
          </h2>
          <p className="text-gray-600 text-lg">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8">
          <svg className="w-full max-w-[250px] h-auto mx-auto text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Back to Home Button */}
        <button onClick={() => navigate('/')} className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          <Home className="w-5 h-5 mr-2" />
            
          Back to Home
        </button>
      </div>

      {/* Navigation Links */}
      <div className="mt-8 space-x-4">
        <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Help Center</a>
        <span className="text-gray-400">|</span>
        <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</a>
      </div>
    </div>
  );
};

export default NotFound;