import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 bg-green-500 text-white py-3 px-5 rounded-lg shadow-lg flex items-center animate-fade-in-down">
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-full hover:bg-green-600 transition-colors">
        <CloseIcon />
      </button>
    </div>
  );
};

export default Notification;
