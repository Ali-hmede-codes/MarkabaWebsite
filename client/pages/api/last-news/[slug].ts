import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Slug is required' 
    });
  }

  try {
    const url = `${API_BASE_URL}/last-news/slug/${slug}`;
    
    console.log('Fetching last news by slug from URL:', url);
    
    // Create timeout controller
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_HEADERS,
      signal: controller.signal,
    });
    
    cleanup();

    console.log('Last news by slug response status:', response.status);
    console.log('Last news by slug response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return res.status(response.status).json({
        success: false,
        message: 'Failed to fetch last news',
        error: errorText
      });
    }

    const data = await response.json();
    console.log('Last news by slug data received:', data);
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Last news by slug API error:', error);
    
    const apiError = handleApiError(error, `/last-news/${slug}`);
    return res.status(apiError.status).json({
      success: false,
      message: apiError.message,
      error: apiError.error
    });
  }
}