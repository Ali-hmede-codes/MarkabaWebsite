import { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_API_BASE } from '../../../../lib/api/config';

const API_BASE_URL = INTERNAL_API_BASE;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const { id, ...queryParams } = query;
  
  try {
    // Build the backend URL for specific admin category
    let backendUrl = `${API_BASE_URL}/admin/administratorpage/categories/${id}`;
    
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
    
    // Add body for POST/PUT/PATCH requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Admin Category API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}