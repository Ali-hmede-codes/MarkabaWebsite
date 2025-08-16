import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  
  try {
    // Build the backend URL for admin ads
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.markaba.news';
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
    
    // Get auth token from cookies or headers
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
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
    
    console.log(`Proxying ${method} request to: ${backendUrl}`);
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        success: false, 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      return res.status(response.status).json(errorData);
    }
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Admin Ads API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}