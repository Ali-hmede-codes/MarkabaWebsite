import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ error: 'رمز غير صالح' });
    }

    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف الخبر مطلوب' 
      });
    }

    // Forward request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/admin/administratorpage/last-news/${id}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: req.method !== 'GET' && req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined,
    });

    const data = await backendResponse.json();
    
    // Return the response from backend
    return res.status(backendResponse.status).json(data);
    
  } catch (error) {
    console.error('Error in last news by ID API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'خطأ في الخادم' 
    });
  }
}