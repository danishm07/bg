import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, BookOpen, Users, MessageCircle } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navLinks = [
    { path: '/study', label: 'Study', icon: BookOpen },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/chat-rooms', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-container">
          <span className="logo">LearnTogether</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path)}`}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="auth-buttons">
          {user ? (
            <>
              <span className="text-secondary-color mr-4">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="secondary-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="secondary-button">
                Login
              </Link>
              <Link to="/register" className="primary-button">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        {navLinks.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link ${isActive(path)}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon size={18} />
              <span>{label}</span>
            </div>
          </Link>
        ))}
        {user ? (
          <>
            <span className="text-secondary-color text-center">
              {user.email}
            </span>
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="secondary-button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="secondary-button"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="primary-button"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;