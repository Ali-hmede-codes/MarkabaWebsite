import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/last-news`, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}