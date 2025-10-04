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
          minHeight: '200px',
          height: 'clamp(200px, 25vw, 300px)',
          aspectRatio: '4/3'
        }}
      />
    </div>
  );
};

export default SidebarTopAd;