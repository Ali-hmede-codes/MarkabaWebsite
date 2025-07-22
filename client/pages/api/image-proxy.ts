import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate that the URL is from our backend
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api.*$/, '') || 'http://69.62.115.12:5000';
    
    let imageUrl = url;
    
    // If it's a relative path, make it absolute
    if (!url.startsWith('http')) {
      if (url.startsWith('/uploads/') || url.startsWith('/images/')) {
        imageUrl = `${backendBase}${url}`;
      } else {
        imageUrl = `${backendBase}/uploads/${url}`;
      }
    }

    // Fetch the image from the backend
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NewsMarkaba-ImageProxy/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}