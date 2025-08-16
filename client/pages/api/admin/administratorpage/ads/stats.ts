import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get auth token from request headers or cookies
    const authHeader = req.headers.authorization;
    const token = req.cookies.token;
    
    if (!authHeader && !token) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    // Use authorization header if available, otherwise use cookie token
    const authorization = authHeader || `Bearer ${token}`;

    // Forward request to backend stats endpoint
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${BACKEND_URL}/api/admin/administratorpage/ads/stats/overview`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Ads stats API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}