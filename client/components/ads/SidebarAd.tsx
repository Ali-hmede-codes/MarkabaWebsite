import React from 'react';
import AdDisplay from './AdDisplay';

interface SidebarAdProps {
  className?: string;
}

const SidebarAd: React.FC<SidebarAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full mb-6 ${className}`}>
      <AdDisplay 
        position="sidebar"
        className="w-full"
        style={{ 
          height: '300px',
          minHeight: '300px',
          maxHeight: '300px'
        }}
      />
    </div>
  );
};

export default SidebarAd;