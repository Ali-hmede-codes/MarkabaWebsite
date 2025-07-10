import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { active, limit, language, include_content } = req.query;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (active) queryParams.append('active', active as string);
    if (limit) queryParams.append('limit', limit as string);
    if (language) queryParams.append('language', language as string);
    if (include_content) queryParams.append('include_content', include_content as string);

    // Determine the endpoint based on query parameters
    let endpoint = '/breaking-news';
    if (active === 'true') {
      endpoint = '/breaking-news/active';
    }

    const url = `${API_BASE_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Breaking news API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breaking news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}