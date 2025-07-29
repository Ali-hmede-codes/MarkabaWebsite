import { NextApiRequest, NextApiResponse } from 'next';

import { API_BASE_URL } from '../../../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;
  
  if (method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  
  try {
    // Build the backend URL for reset-password
    const backendUrl = `${API_BASE_URL}/users/${id}/reset-password`;
    
    // Get auth token from cookies
    const token = req.cookies.token;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: 'PATCH',
      headers,
      body: JSON.stringify(req.body),
    };
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    const data = await response.json();
    
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('User Password API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}