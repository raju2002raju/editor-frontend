// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in by looking for token in localStorage
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    // If not authenticated, redirect to 404 page
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default ProtectedRoute;