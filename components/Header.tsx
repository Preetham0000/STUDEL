import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../constants';
import { LogoutIcon } from './Icons';
import Button from './common/Button';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/portal" : "/"} className="text-2xl font-bold text-primary-600">{APP_NAME}</Link>
          </div>
          <div className="flex items-center space-x-4">
             {isAuthenticated && user ? (
                 <>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        aria-label="Logout"
                    >
                        <LogoutIcon className="w-6 h-6" />
                    </button>                 
                 </>
             ) : (
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="primary" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;