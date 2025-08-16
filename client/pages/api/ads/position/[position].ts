import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../../../lib/api/config';

interface Ad {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  is_active: boolean;
  expires_at: string;
  clicks: number;
}

interface ApiResponse {
  success: boolean;
  ad?: Ad;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { position } = req.query;

  if (!position || typeof position !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Position parameter is required'
    });
  }

  try {
    // Forward the request to the backend server
    const response = await fetch(`${API_BASE_URL}/ads/position/${position}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'No active ad found for this position'
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      ad: data.ad
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}