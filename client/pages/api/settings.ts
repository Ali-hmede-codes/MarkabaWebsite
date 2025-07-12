import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // Get all settings
      const response = await fetch(`${API_BASE_URL}/settings`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
      
    } else if (method === 'PUT') {
      // Update a specific setting
      const { setting_key, setting_value_ar } = req.body;
      
      if (!setting_key || setting_value_ar === undefined) {
        return res.status(400).json({ error: 'setting_key and setting_value_ar are required' });
      }
      
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: [{
            setting_key,
            setting_value_ar,
            data_type: 'string',
            category: 'general'
          }]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend API error:', errorData);
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
      
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
    }
    
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}