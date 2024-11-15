import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from './Components/LoginPage/LoginPage'
import './App.css'
import Home from './Components/Home/Home'
import MyDocument from './Components/MyDocument/MyDocument'

const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route  path='/' element={<LoginPage/>}/>
      <Route path='/my-documents' element={<MyDocument/>} />
      <Route path='/home' element={<Home/>} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
