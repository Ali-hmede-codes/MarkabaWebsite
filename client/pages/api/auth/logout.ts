import { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_API_BASE } from '../../../lib/api/config';

interface LogoutResponse {
  success: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Get tokens from cookies
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    // If we have tokens, try to invalidate them on the backend
    if (token || refreshToken) {
      try {
        const backendUrl = INTERNAL_API_BASE;
        const response = await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'Cookie': refreshToken ? `refreshToken=${refreshToken}` : ''
          },
          body: JSON.stringify({})
        });
        
        // Don't throw error if backend logout fails, just log it
        if (!response.ok) {
          console.warn('Backend logout failed:', response.status, response.statusText);
        }
      } catch (error) {
        // Backend logout failed, but we'll still clear client cookies
        console.error('Backend logout failed:', error);
      }
    }

    // Clear all authentication cookies
    const cookiesToClear = [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
      'remember_me=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    ];

    res.setHeader('Set-Cookie', cookiesToClear);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}