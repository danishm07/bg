
import './Modern.css'
import './global.css';
import './index.css';


import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ChatRooms from './components/ChatRooms';
import ChatRoom from './components/ChatRoom';
import Navbar from './components/Navigation';
import Groups from './components/Groups';
import GroupDetail from './components/GroupDetail';
import CreateChatRoomModal from './components/CreateChatRoomModal';

import StudyHub from './components/StudyHub';
import TextInput from './components/TextInput';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};


function App() {
  const [deviceType, setDeviceType] = useState('desktop');
  const { logout } = useAuth();


  useEffect(() => {
    const detectDeviceType = () => {
      const ua = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(ua)) {
        setDeviceType('ios');
      } else if (/Android/.test(ua)) {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }
    };

    

    detectDeviceType();
    window.addEventListener('resize', detectDeviceType);

    return () => window.removeEventListener('resize', detectDeviceType);
  }, []);


  /*useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (e.persisted) return; // Do nothing if it's a refresh
      logout();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [logout]);
*/

  return (
    <div className={`app ${deviceType}`}>
      <AuthProvider>
        <Router>
          <Navbar/>
          <div className="main-content">
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/CreateChatRoomModal" element={<ProtectedRoute><CreateChatRoomModal /></ProtectedRoute>} />
                <Route path="/chat-rooms" element={
                  <ProtectedRoute>
                    <ChatRooms />
                  </ProtectedRoute>
                } />
                <Route 
                  path="/chat-room/:roomId" 
                  element={
                    <ProtectedRoute>
                      <ChatRoom deviceType={deviceType}/>
                    </ProtectedRoute>
                  } 
                />
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                } />
                <Route path="/group/:groupId" element={
                  <ProtectedRoute>
                    <GroupDetail />
                  </ProtectedRoute>
                } />
                <Route path="/study" element={
                  <ProtectedRoute>
                    <StudyHub />
                  </ProtectedRoute>
                } />
                <Route path="/study/text" element={
                  <ProtectedRoute>
                    <TextInput />
                  </ProtectedRoute>
                } />
                      
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;