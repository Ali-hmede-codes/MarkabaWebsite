import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID is required' });
  }

  try {
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  try {
    switch (method) {
      case 'PUT':
        // Update last news
        const putResponse = await fetch(`${API_BASE_URL}/api/admin/administratorpage/last-news/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });
        const putData = await putResponse.json();
        return res.status(putResponse.status).json(putData);

      case 'DELETE':
        // Delete last news
        const deleteResponse = await fetch(`${API_BASE_URL}/api/admin/administratorpage/last-news/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const deleteData = await deleteResponse.json();
        return res.status(deleteResponse.status).json(deleteData);

      case 'GET':
        // Get single last news
        const getResponse = await fetch(`${API_BASE_URL}/api/admin/administratorpage/last-news/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const getData = await getResponse.json();
        return res.status(getResponse.status).json(getData);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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