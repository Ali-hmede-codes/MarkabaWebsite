import { NextApiRequest, NextApiResponse } from 'next';

import { API_BASE_URL } from '../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const { id, ...queryParams } = query;
  
  try {
    // Build the backend URL - users endpoint is under admin
    let backendUrl = `${API_BASE_URL}/admin/adminstratorpage/users`;
    
    // Handle specific user ID
    if (id) {
      backendUrl += `/${id}`;
    }
    
    // Add query parameters
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    
    if (searchParams.toString()) {
      backendUrl += `?${searchParams.toString()}`;
    }
    
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
      method,
      headers,
    };
    
    // Add body for POST/PUT requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    if (!response.ok) {
      // Handle non-JSON error responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      } else {
        // Handle HTML error responses (like 404 pages)
        return res.status(response.status).json({
          success: false,
          message: `Backend API error: ${response.status} ${response.statusText}`
        });
      }
    }
    
    const data = await response.json();
    
    // Return response as-is since the backend already returns the correct format
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Users API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}