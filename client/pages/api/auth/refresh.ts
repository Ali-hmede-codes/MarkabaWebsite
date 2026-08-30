import { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_API_BASE } from '../../../lib/api/config';

interface RefreshResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    expires_in?: string;
    token_type?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Forward request to backend refresh service
    const backendUrl = INTERNAL_API_BASE;
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Extract new token from backend response
      const newToken = data.data?.access_token || data.data?.token;
      
      if (!newToken) {
        return res.status(500).json({
          success: false,
          message: 'Invalid response from authentication service'
        });
      }

      // Set new token cookie with consistent expiration
      const rememberMe = req.cookies.remember_me === 'true';
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 48 * 60 * 60; // Consistent with backend
      const isSecure = process.env.NODE_ENV === 'production';
      
      const cookies = [
        `token=${newToken}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      ];
      
      // Forward backend refresh token cookie if present
      const refreshTokenCookie = response.headers.get('set-cookie');
      if (refreshTokenCookie) {
        cookies.push(refreshTokenCookie);
      }
      
      res.setHeader('Set-Cookie', cookies);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          expires_in: data.data?.expires_in || '2h',
          token_type: 'Bearer'
        }
      });
    } else {
      // Clear invalid refresh token cookie
      res.setHeader('Set-Cookie', [
        'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
      ]);
      
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Token refresh failed'
      });
    }
  } catch (error) {
    console.error('Token refresh API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}