import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  
  try {
    // Build the backend URL for admin ads
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';
    let backendUrl = `${BACKEND_URL}/api/v2/admin/administratorpage/ads`;
    
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
    
    // Get auth token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Authentication required' 
      });
    }
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST/PUT/PATCH requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    // Return response with same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Admin Ads API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}