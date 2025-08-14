import { NextApiRequest, NextApiResponse } from 'next';
import * as formidable from 'formidable';
import * as fs from 'fs';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// TypeScript interfaces
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: string[];
}

// Validation helper functions
const validateAdData = (fields: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate URL format if provided
  if (fields.url && fields.url[0]) {
    try {
      new URL(fields.url[0]);
    } catch {
      errors.push('Invalid URL format');
    }
  }
  
  // Validate end date if provided
  if (fields.end_date && fields.end_date[0]) {
    const endDate = new Date(fields.end_date[0]);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) {
      errors.push('End date must be a valid future date');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method, query } = req;
  const { id, action } = query;

  try {
    // Build the backend URL for specific ad operations
    let backendUrl = `${BACKEND_URL}/api/admin/administratorpage/ads/${id}`;
    
    if (action) {
      backendUrl += `/${action}`;
    }

    // Get auth token from cookies or headers
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }

    // Verify JWT token
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Handle different HTTP methods
    if (method === 'GET') {
      // GET single ad or ad stats
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(backendUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      return res.status(response.status).json(data);

    } else if (method === 'PUT') {
      // UPDATE ad
      const form = formidable({
        uploadDir: './temp',
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });

      const [fields, files] = await form.parse(req);
      
      // Validate the data
      const validation = validateAdData(fields);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Create FormData for multipart request
      const formData = new FormData();
      
      // Add text fields
      Object.keys(fields).forEach(key => {
        if (fields[key] && fields[key][0]) {
          formData.append(key, fields[key][0]);
        }
      });
      
      // Add image file if provided
      if (files.image && files.image[0]) {
        const file = files.image[0];
        const fileStream = fs.createReadStream(file.filepath);
        formData.append('image', fileStream, {
          filename: file.originalFilename || 'image.jpg',
          contentType: file.mimetype || 'image/jpeg'
        });
      }

      // Send request to backend
      const response = await fetch(backendUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const data = await response.json();
      
      // Clean up temp files
      if (files.image && files.image[0]) {
        try {
          await fs.promises.unlink(files.image[0].filepath);
        } catch (error) {
          console.error('Error cleaning up temp file:', error);
        }
      }

      return res.status(response.status).json(data);

    } else if (method === 'DELETE') {
      // DELETE ad
      const response = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);

    } else {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}