import React from 'react'
import { Routes, Route} from 'react-router-dom'
import LoginPage from './Components/LoginPage/LoginPage'
import './App.css'
import MyDocument from './Components/MyDocument/MyDocument'
import NotFound from './Components/NotFound'
import ProtectedRoute from './Components/Pages/ProtectedRoute'
import Home from './Components/Home/Home'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home /> } />
      <Route path="/my-documents" element={<MyDocument/>} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App
