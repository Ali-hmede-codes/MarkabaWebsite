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
  const backendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5000';

  try {
    switch (method) {
      case 'GET': {
        // Forward query parameters to backend
        const queryParams = new URLSearchParams();
        
        if (query.position) {
          queryParams.append('position', query.position as string);
        }
        
        if (query.active_only !== undefined) {
          queryParams.append('active_only', query.active_only as string);
        }

        const url = `${backendUrl}/api/ads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      case 'POST': {
        // Handle ad interactions (clicks, impressions)
        const { adId, action } = req.body;
        
        if (!adId || !action) {
          return res.status(400).json({
            success: false,
            message: 'Ad ID and action are required'
          });
        }

        let endpoint = '';
        if (action === 'click') {
          endpoint = `/api/ads/${adId}/click`;
        } else if (action === 'impression') {
          endpoint = `/api/ads/${adId}/impression`;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use "click" or "impression"'
          });
        }

        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
            'User-Agent': req.headers['user-agent'] || '',
            'Referer': req.headers.referer || ''
          },
          body: JSON.stringify({
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user_agent: req.headers['user-agent'],
            referrer: req.headers.referer
          })
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Ads API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handle individual ad actions
export async function handleAdAction(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  adId: string,
  action: 'click' | 'impression'
) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${backendUrl}/api/ads/${adId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
        'User-Agent': req.headers['user-agent'] || '',
        'Referer': req.headers.referer || ''
      },
      body: JSON.stringify({
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        referrer: req.headers.referer
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Ad ${action} tracking error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track ad interaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}