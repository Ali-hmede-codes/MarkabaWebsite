import React from 'react';
import AdDisplay from './AdDisplay';

interface SidebarTopAdProps {
  className?: string;
}

const SidebarTopAd: React.FC<SidebarTopAdProps> = ({ className = '' }) => {
  return (
    <div className={`sidebar-top-ad ${className}`}>
      <AdDisplay 
        position="sidebar_top" 
        className="w-full"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default SidebarTopAd;