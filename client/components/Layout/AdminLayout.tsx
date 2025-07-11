import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import AdminNav from '../admin/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'لوحة التحكم',
  description = 'لوحة تحكم إدارة الموقع',
  className = '',
}) => {
  const fullTitle = `${title} - نيوز مركبة`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gray-50 ${className}`} dir="rtl">
        {/* Admin Navigation */}
        <AdminNav />

        {/* Main Admin Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Toast Notifications */}
        <Toaster
          position="top-left"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Noto Sans Arabic, Arial, sans-serif',
              direction: 'rtl',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </>
  );
};

export default AdminLayout;