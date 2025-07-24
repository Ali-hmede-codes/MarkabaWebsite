import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://markaba.news/api/v2';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const { id, ...queryParams } = query;
  
  try {
    // Build the backend URL
    let backendUrl = `${API_BASE_URL}/categories`;
    
    // Handle specific category ID
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
    const data = await response.json();
    
    // Transform the response to match frontend expectations
    if (data.success && data.data && data.data.categories) {
      // For GET requests, return categories directly in data field
      const transformedData = {
        ...data,
        data: data.data.categories
      };
      res.status(response.status).json(transformedData);
    } else {
      // Return response as-is for other cases
      res.status(response.status).json(data);
    }
    
  } catch (error) {
    console.error('Categories API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}