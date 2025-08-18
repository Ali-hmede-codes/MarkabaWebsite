import React from 'react';
import AdDisplay from './AdDisplay';

interface MainTopAdProps {
  className?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

const MainTopAd: React.FC<MainTopAdProps> = ({ 
  className = '', 
  showOnMobile = true, 
  showOnDesktop = true 
}) => {
  // Determine visibility classes based on props
  const getVisibilityClasses = () => {
    if (showOnMobile && showOnDesktop) {
      return 'block'; // Show on all devices
    } else if (showOnMobile && !showOnDesktop) {
      return 'block lg:hidden'; // Show only on mobile
    } else if (!showOnMobile && showOnDesktop) {
      return 'hidden lg:block'; // Show only on desktop
    } else {
      return 'hidden'; // Hide on all devices
    }
  };

  return (
    <div className={`main-top-ad ${className} ${getVisibilityClasses()} w-full max-w-6xl mx-auto`}>
      <AdDisplay 
        position="main_top" 
        className="w-full"
        style={{ 
          height: 'clamp(100px, 12vw, 150px)',
          maxWidth: '1280px',
          margin: '0 auto',
          aspectRatio: '1280/150'
        }}
      />
    </div>
  );
};

export default MainTopAd;