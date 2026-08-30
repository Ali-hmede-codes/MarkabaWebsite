import { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_API_BASE } from '../../../lib/api/config';

const API_BASE_URL = INTERNAL_API_BASE;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  try {
    const backendUrl = `${API_BASE_URL}/social-media/admin`;

    // Get auth token from cookies or headers
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`Proxying ${method} request to: ${backendUrl}`);

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
    console.error('Social media admin API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}