import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../../../../lib/api/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const apiUrl = `${API_BASE_URL}/admin/administratorpage/last-news`;
    
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}