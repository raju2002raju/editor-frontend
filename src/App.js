import React from 'react'
import { Routes, Route, BrowserRouter} from 'react-router-dom'
import './App.css'
import MyDocument from './Components/MyDocument/MyDocument'
import Home from './Components/Home/Home'

const App = () => {
  return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home /> } />
      <Route path="/my-documents" element={<MyDocument/>} />
    </Routes>
  </BrowserRouter>
  );
}

export default App
