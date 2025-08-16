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
  const { id } = query;
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

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ad ID'
    });
  }

  try {
    switch (method) {
      case 'GET': {
        // Forward query parameters to backend for statistics filtering
        const queryParams = new URLSearchParams();
        
        Object.entries(query).forEach(([key, value]) => {
          if (key !== 'id' && value && typeof value === 'string') {
            queryParams.append(key, value);
          }
        });

        const url = `${backendUrl}/api/admin/ads/${id}/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Individual Ad Stats API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}