import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TestAds: React.FC = () => {
  const { user, token } = useAuth();
  const [adsData, setAdsData] = useState<any>(null);
  const [positionsData, setPositionsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testFetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/ads', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      setAdsData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testFetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/ads?positions=true', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      setPositionsData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Ads API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth Status:</h3>
        <p>User: {user ? user.username : 'Not logged in'}</p>
        <p>Token: {token ? 'Present' : 'Not present'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testFetchAds} disabled={loading}>
          Test Fetch Ads
        </button>
        <button onClick={testFetchPositions} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Fetch Positions
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {adsData && (
        <div>
          <h3>Ads Data:</h3>
          <pre>{JSON.stringify(adsData, null, 2)}</pre>
        </div>
      )}
      
      {positionsData && (
        <div>
          <h3>Positions Data:</h3>
          <pre>{JSON.stringify(positionsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestAds;