import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { active, limit, language, include_content } = req.query;
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (active) queryParams.append('active', active as string);
  if (limit) queryParams.append('limit', limit as string);
  if (language) queryParams.append('language', language as string);
  if (include_content) queryParams.append('include_content', include_content as string);

  try {
    const url = `${API_BASE_URL}/last-news${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Fetching last news from URL:', url);
    
    // Create timeout controller
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_HEADERS,
      signal: controller.signal,
    });
    
    cleanup();

    console.log('Last news response status:', response.status);
    console.log('Last news response ok:', response.ok);

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
    console.log('Last news data received:', data);
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Last news API error:', error);
    
    const apiError = handleApiError(error, '/last-news');
    return res.status(apiError.status).json({
      success: false,
      message: apiError.message,
      error: apiError.error
    });
  }
}