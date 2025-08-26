import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { APP_NAME } from '../constants';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const SignUpPage: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [campusId, setCampusId] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !phone || !role) {
      setError('Please fill all required fields.');
      return;
    }
    if (role === Role.RUNNER && !campusId) {
      setError('Campus ID is required for runners.');
      return;
    }

    try {
      await signup(name, phone, role, campusId);
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    }
  };

  const renderStep1 = () => (
    <>
      <h2 className="text-2xl font-display font-bold text-center text-gray-800 mb-2">Join Studel</h2>
      <p className="text-center text-gray-600 mb-8">How would you like to join us?</p>
      <div className="space-y-4">
        <Button onClick={() => handleRoleSelect(Role.CUSTOMER)} className="w-full !py-3 !text-base" variant="secondary">
          I'm a Student / Teacher (Order Items)
        </Button>
        <Button onClick={() => handleRoleSelect(Role.RUNNER)} className="w-full !py-3 !text-base" variant="secondary">
          I want to be a Runner (Deliver)
        </Button>
        <Button onClick={() => handleRoleSelect(Role.CANTEEN)} className="w-full !py-3 !text-base" variant="secondary">
          I'm a Shop / Canteen Owner
        </Button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline mb-4">&larr; Back to role selection</button>
      <h2 className="text-2xl font-display font-bold text-center text-gray-800 mb-6">Create Your {role} Account</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full input-style" required />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full input-style" required />
        </div>
        {role === Role.RUNNER && (
          <div>
            <label htmlFor="campusId" className="block text-sm font-medium text-gray-700">Campus ID</label>
            <input type="text" id="campusId" value={campusId} onChange={(e) => setCampusId(e.target.value)} className="mt-1 block w-full input-style" required />
          </div>
        )}
        <Button type="submit" className="w-full" isLoading={isLoading}>Sign Up</Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
       <style>{`.input-style { box-sizing: border-box; appearance: none; background-color: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; width: 100%; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #4f46e5; box-shadow: 0 0 0 1px #4f46e5;}`}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Link to="/" className="text-4xl font-extrabold font-display text-primary-600 tracking-tight">{APP_NAME}</Link>
        </div>
        <Card className="p-8">
          {step === 1 ? renderStep1() : renderStep2()}
           <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        Login
                    </Link>
                </p>
            </div>
        </Card>
      </div>
    </div>
  );
};
export default SignUpPage;