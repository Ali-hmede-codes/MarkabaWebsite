import { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_API_BASE } from '../../../lib/api/config';

interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  remember_me?: boolean;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
      display_name?: string;
      first_name?: string;
      last_name?: string;
      is_active: boolean;
      created_at: string;
      last_login: string;
      login_ip: string;
      session_expires: string;
    };
    token?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { username, email, password, remember_me }: LoginRequest = req.body;

    // Validate required fields
    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    const backendUrl = INTERNAL_API_BASE;
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers['x-forwarded-for'] as string || 
                          req.socket.remoteAddress || 
                          'unknown',
        'User-Agent': req.headers['user-agent'] || 'Unknown'
      },
      body: JSON.stringify({
        ...(username ? { username } : { email }),
        password,
        remember_me
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Extract token and user from backend response
      const token = data.data?.token || data.data?.access_token;
      const user = data.data?.user;

      if (!token || !user) {
        return res.status(500).json({
          success: false,
          message: 'Invalid response from authentication service'
        });
      }

      // Set secure cookies for frontend with consistent expiration
      const cookieMaxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000; // Consistent with backend
      const isSecure = process.env.NODE_ENV === 'production';
      
      // Set authentication cookies with proper formatting (no HttpOnly for client-side access)
      const cookies = [
        `token=${token}; Path=/; Max-Age=${Math.floor(cookieMaxAge / 1000)}; SameSite=Lax${isSecure ? '; Secure' : ''}`,
        `user=${encodeURIComponent(JSON.stringify(user))}; Path=/; Max-Age=${Math.floor(cookieMaxAge / 1000)}; SameSite=Lax${isSecure ? '; Secure' : ''}`,
        `remember_me=${remember_me ? 'true' : 'false'}; Path=/; Max-Age=${Math.floor(cookieMaxAge / 1000)}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      ];
      
      // Forward backend refresh token cookie if present
      const backendCookies = response.headers.get('set-cookie');
      if (backendCookies) {
        cookies.push(...backendCookies.split(', '));
      }
      
      res.setHeader('Set-Cookie', cookies);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user,
          token: token
        }
      });
    } else {
      // Forward backend error response
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}