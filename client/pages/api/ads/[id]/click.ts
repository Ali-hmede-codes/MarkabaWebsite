import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../../../lib/api/config';

interface ApiResponse {
  success: boolean;
  message?: string;
  clicks?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Ad ID parameter is required'
    });
  }

  try {
    // Forward the request to the backend server
    const response = await fetch(`${API_BASE_URL}/ads/${id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Click tracked successfully',
      clicks: data.clicks
    });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}