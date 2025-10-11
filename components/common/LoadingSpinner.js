import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div className="loading-spinner" style={{ 
      width: sizes[size], 
      height: sizes[size] 
    }}></div>
  );
};

export default LoadingSpinner;