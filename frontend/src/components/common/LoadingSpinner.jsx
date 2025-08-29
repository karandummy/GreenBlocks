import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-4`}
      >
        <Leaf className="h-1/2 w-1/2 text-white" />
      </motion.div>
      <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;