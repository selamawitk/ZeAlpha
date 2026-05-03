import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-primary text-white hover:bg-dark rounded-full px-8 py-3 focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-dark rounded-full px-8 py-3 focus:ring-secondary',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white rounded-full px-8 py-3 focus:ring-primary',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;