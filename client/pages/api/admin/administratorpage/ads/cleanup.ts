import { NextApiRequest, NextApiResponse } from 'next';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method, query } = req;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // Extract auth token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    switch (method) {
      case 'DELETE': {
        // Forward query parameters to backend for cleanup options
        const queryParams = new URLSearchParams();
        
        Object.entries(query).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            queryParams.append(key, value);
          }
        });

        const url = `${backendUrl}/api/admin/ads/cleanup${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Ad Cleanup API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}