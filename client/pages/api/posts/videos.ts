import { NextApiRequest, NextApiResponse } from 'next';

import { INTERNAL_API_BASE } from '../../../lib/api/config';

const API_BASE_URL = INTERNAL_API_BASE;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  
  try {
    // Build the backend URL for video posts
    let backendUrl = `${API_BASE_URL}/posts/videos`;
    
    // Add query parameters
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    
    if (searchParams.toString()) {
      backendUrl += `?${searchParams.toString()}`;
    }
    
    // Get auth token from cookies (optional for public videos)
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
      method,
      headers,
    };
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    // Return response with same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Videos API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}