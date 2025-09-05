import React from 'react'
import RecordingPage from './components/pages/RecordingPage'
import { Link, Route,  Routes } from 'react-router-dom'
import RecordingListPages from './components/pages/RecordingListPages'
import './App.css'
const App = () => {
  return (
    <>
      <div className='min-h-screen flex flex-col gap-10 bg-gray-400 font-style-italic'>
        <nav className='flex gap-10 text-blue-500 font-bold m-5'>
          <Link to="/">Recorder</Link>
          <Link to="/recordings">Recording List</Link>
        </nav>
        <Routes>
          <Route path="/" element={<RecordingPage/>}/>
          <Route path="/recordings" element={<RecordingListPages/>}/>
        </Routes>
      </div>
    
    </>
  )
}

export default App