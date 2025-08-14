import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get auth token from cookies or headers
  const cookieToken = req.cookies.token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('Cookie token:', cookieToken);
  console.log('Header token:', headerToken);
  console.log('All cookies:', req.cookies);
  console.log('All headers:', req.headers);
  
  return res.status(200).json({
    success: true,
    data: {
      cookieToken: cookieToken || 'No cookie token',
      headerToken: headerToken || 'No header token',
      cookies: req.cookies,
      authHeader: req.headers.authorization || 'No auth header'
    }
  });
}