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
        style={{ 
          minHeight: '200px',
          height: 'clamp(200px, 25vw, 300px)',
          aspectRatio: '4/3'
        }}
      />
    </div>
  );
};

export default SidebarMiddleAd;