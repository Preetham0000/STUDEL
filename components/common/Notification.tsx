
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '../Icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = 'fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg flex items-center space-x-3';
  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircleIcon className="h-6 w-6" /> : <XCircleIcon className="h-6 w-6" />}
      <span>{message}</span>
    </div>
  );
};

export default Notification;
