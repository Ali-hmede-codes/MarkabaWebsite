import React from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import '@/styles/globals.css';
import '@/styles/animations.css';

// Import Heroicons CSS for proper icon rendering
import '@heroicons/react/24/outline';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Handle route changes for analytics or other tracking
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Add analytics tracking here if needed
      console.log('Route changed to:', url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Handle loading states
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Show loading indicator if needed
    };

    const handleRouteChangeComplete = () => {
      // Hide loading indicator if needed
    };

    const handleRouteChangeError = () => {
      // Hide loading indicator and show error if needed
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router.events]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <Component {...pageProps} />
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;