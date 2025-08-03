import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { id } = query;
  
  if (method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Build the backend URL for status update
    const backendUrl = `${API_BASE_URL}/admin/administratorpage/posts/${id}/status`;
    
    // Get auth token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Forward the request to backend
    const response = await fetch(backendUrl, {
      method: 'PATCH', // Server expects PATCH for status updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    
    // Return response with same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Status API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}