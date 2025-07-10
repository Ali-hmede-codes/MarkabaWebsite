import React from 'react';
import Layout from '../../components/Layout/Layout';
import LogoSettings from '../../components/admin/LogoSettings';

const AdminLogoPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            إدارة شعار الموقع
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <LogoSettings />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogoPage;