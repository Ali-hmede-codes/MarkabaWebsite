import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const path = req.query.path as string[];
  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  const imagePath = path.join('/');
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const baseUrl = backendUrl.replace(/\/api.*$/, '');
  const cleanPath = imagePath.replace(/^\/?uploads\//, '');
  const targetUrl = `${baseUrl}/uploads/${cleanPath}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Image not found' });
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}