import React from 'react';
import AdDisplay from './AdDisplay';

interface SidebarMiddleAdProps {
  className?: string;
}

const SidebarMiddleAd: React.FC<SidebarMiddleAdProps> = ({ className = '' }) => {
  return (
    <div className={`sidebar-middle-ad ${className}`}>
      <AdDisplay 
        position="sidebar_middle" 
        className="w-full"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default SidebarMiddleAd;