
import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
