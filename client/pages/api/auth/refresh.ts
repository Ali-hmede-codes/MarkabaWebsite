import { NextApiRequest, NextApiResponse } from 'next';

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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://markaba.news/api/v2';
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

      // Forward the new refresh token cookie if provided
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        res.setHeader('Set-Cookie', setCookieHeader);
      }

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
        'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict'
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