import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  
  // Only allow GET requests for public team endpoint
  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    // Build the backend URL for public team endpoint
    const backendUrl = `${API_BASE_URL}/team`;
    
    // Make request to backend (no authentication required)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    // Return response with same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}