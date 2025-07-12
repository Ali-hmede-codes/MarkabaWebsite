import { NextApiRequest, NextApiResponse } from 'next';

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

    // Forward request to backend auth service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2';
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

      // Set secure cookies for frontend
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: remember_me ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
        path: '/'
      };

      // Set authentication cookies
      res.setHeader('Set-Cookie', [
        `token=${token}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`,
        `user=${encodeURIComponent(JSON.stringify(user))}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      ]);

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