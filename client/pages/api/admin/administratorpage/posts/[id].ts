import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';

import { INTERNAL_API_BASE } from '../../../../../lib/api/config';

const API_BASE_URL = INTERNAL_API_BASE;

// Disable body parsing for multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { id } = query;
  
  try {
    // Build the backend URL for specific post (admin endpoint)
    const backendUrl = `${API_BASE_URL}/admin/administratorpage/posts/${id}`;
    
    // Get auth token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Authentication required' 
      });
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      // Handle multipart form data for file uploads
      const form = formidable({
        multiples: false,
        keepExtensions: true,
      });

      const [fields, files] = await form.parse(req);

      // Create FormData for backend request
      const formData = new FormData();

      // Add all text fields
      Object.entries(fields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, value[0]);
        } else {
          formData.append(key, value || '');
        }
      });

      // Add file if present
      if (files.featured_image && Array.isArray(files.featured_image) && files.featured_image[0]) {
        const file = files.featured_image[0];
        const fileStream = fs.createReadStream(file.filepath);
        formData.append('featured_image', fileStream, {
          filename: file.originalFilename || 'image.jpg',
          contentType: file.mimetype || 'image/jpeg',
        });
      }

      // Forward request to backend
      const response = await fetch(backendUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(200).json(data);
    } else {
      // Handle other methods (GET, DELETE) with JSON
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      const fetchOptions: RequestInit = {
        method,
        headers,
      };
      
      // Make request to backend
      const response = await fetch(backendUrl, fetchOptions);
      const data = await response.json();
      
      // Return response with same status code
      res.status(response.status).json(data);
    }
    
  } catch (error) {
    console.error('Admin Post API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}