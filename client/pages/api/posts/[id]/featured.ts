import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { id } = query;
  
  if (method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Build the backend URL for featured toggle
    const backendUrl = `${API_BASE_URL}/admin/administratorpage/posts/${id}/featured`;
    
    // Get auth token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    const fetchOptions: RequestInit = {
      method: 'PATCH',
      headers,
    };
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    // Return response with same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Featured toggle API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}