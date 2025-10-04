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
        style={{ 
          minHeight: '250px',
          height: 'clamp(250px, 30vw, 350px)',
          aspectRatio: '4/3'
        }}
      />
    </div>
  );
};

export default SidebarTopAd;