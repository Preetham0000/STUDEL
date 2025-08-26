import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../constants';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { apiLogin } from '../services/apiService';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone) {
        setError('Please enter your phone number.');
        return;
    }
    try {
        const user = await apiLogin(phone);
        if (user) {
            await login(user.id);
            navigate('/portal');
        } else {
            setError('No account found with this phone number. Please sign up.');
        }
    } catch (err) {
        setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Link to="/" className="text-4xl font-extrabold text-primary-600 tracking-tight">{APP_NAME}</Link>
            <p className="mt-2 text-lg text-gray-600">Your Campus Canteen Companion</p>
        </div>
        
        <Card className="p-8">
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back!</h2>
            
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 1111111111"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Login with OTP
                </Button>
              </div>
            </div>
          </form>
           <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                        Sign Up
                    </Link>
                </p>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;