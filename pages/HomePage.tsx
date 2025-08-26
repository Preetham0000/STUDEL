import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import CustomerPortal from './CustomerPortal';
import RunnerPortal from './RunnerPortal';
import CanteenPortal from './CanteenPortal';
import AdminPortal from './AdminPortal';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  const renderPortal = () => {
    switch (user?.role) {
      case Role.CUSTOMER:
        // A logged-in customer is redirected here, but their main view is the public portal
        // This could be a dedicated account management page in the future
        return <CustomerPortal />;
      case Role.RUNNER:
        return <RunnerPortal />;
      case Role.CANTEEN:
        return <CanteenPortal />;
      case Role.ADMIN:
        return <AdminPortal />;
      default:
        return <div className="p-4">Invalid user role.</div>;
    }
  };

  return (
    <>
      {user ? renderPortal() : <p>Loading...</p>}
    </>
  );
};

export default HomePage;