import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../lib/api/config';

console.log('Breaking News API - Environment check:');
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('- API_BASE_URL:', API_BASE_URL);

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

  // Determine the endpoint based on query parameters
  let endpoint = '/breaking-news';
  if (active === 'true') {
    endpoint = '/breaking-news/active';
  }

  try {

    const url = `${API_BASE_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Fetching from URL:', url);
    
    // Create timeout controller
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_HEADERS,
      signal: controller.signal,
    });
    
    cleanup();

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched breaking news data');
    res.status(200).json(data);
  } catch (error) {
    const errorResponse = handleApiError(error, endpoint);
    res.status(errorResponse.status).json({
      success: false,
      ...errorResponse
    });
  }
}