import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../constants';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
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
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Welcome Back!
            </h2>
            
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <Button type="submit" className="w-full" isLoading={isSubmitting || isLoading}>
                  Login
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