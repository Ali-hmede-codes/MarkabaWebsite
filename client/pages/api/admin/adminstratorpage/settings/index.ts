import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    let url = `${API_BASE_URL}/admin/administratorpage/settings`;
    let method = req.method;
    let body = undefined;

    // Handle different HTTP methods
    if (method === 'PUT' && req.body) {
      body = JSON.stringify(req.body);
    }

    // Forward request to backend
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
