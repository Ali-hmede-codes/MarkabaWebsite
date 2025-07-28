import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }

  try {
    switch (method) {
      case 'GET':
        // Get all last news
        const getResponse = await fetch(`${API_BASE_URL}/api/admin/administratorpage/last-news`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const getData = await getResponse.json();
        return res.status(getResponse.status).json(getData);

      case 'POST':
        // Create new last news
        const postResponse = await fetch(`${API_BASE_URL}/api/admin/administratorpage/last-news`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });
        const postData = await postResponse.json();
        return res.status(postResponse.status).json(postData);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}