import { NextApiRequest, NextApiResponse } from 'next';
import * as formidable from 'formidable';
import * as fs from 'fs';
import FormData from 'form-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

// TypeScript interfaces for Ad data
interface AdData {
  title: string;
  description?: string;
  url: string;
  position: string;
  end_date: string;
  is_active?: boolean;
  image?: File;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: string[];
}

// Validation helper functions
const validateAdData = (fields: Record<string, any>, isUpdate: boolean = false): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields for creation
  if (!isUpdate) {
    if (!fields.title || !fields.title[0]) errors.push('Title is required');
    if (!fields.url || !fields.url[0]) errors.push('URL is required');
    if (!fields.position || !fields.position[0]) errors.push('Position is required');
    if (!fields.end_date || !fields.end_date[0]) errors.push('End date is required');
  }
  
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
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    } else if (endDate <= new Date()) {
      errors.push('End date must be in the future');
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
  const { id, action, ...otherParams } = query;

  try {
    // Build the backend URL for admin ads
    let backendUrl = `${API_BASE_URL}/admin/administratorpage/ads`;

    // Handle different endpoints
    if (id && action) {
      backendUrl += `/${id}/${action}`;
    } else if (id) {
      backendUrl += `/${id}`;
    } else if (req.url?.includes('/positions')) {
      backendUrl += '/positions';
    }

    // Add query parameters if any
    const queryString = new URLSearchParams(otherParams as Record<string, string>).toString();
    if (queryString) {
      backendUrl += `?${queryString}`;
    }

    // Get auth token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }

    // Handle different HTTP methods
    if (method === 'GET') {
      // Simple GET request
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

    } else if (method === 'POST' || method === 'PUT') {
      // Handle multipart form data for file uploads
      const form = new formidable.IncomingForm({
        multiples: false,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
      });

      const [fields, files] = await form.parse(req);

      // Validate input data
      const isUpdate = method === 'PUT';
      const validation = validateAdData(fields, isUpdate);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // For POST (create), image is required
      if (method === 'POST' && (!files.image || !Array.isArray(files.image) || !files.image[0])) {
        return res.status(400).json({
          success: false,
          message: 'Image is required for creating new ads'
        });
      }

      // Validate image file if present
      if (files.image && Array.isArray(files.image) && files.image[0]) {
        const file = files.image[0];
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(file.mimetype || '')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed'
          });
        }
        
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: 'Image size must be less than 5MB'
          });
        }
      }

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
      if (files.image && Array.isArray(files.image) && files.image[0]) {
        const file = files.image[0];
        const fileStream = fs.createReadStream(file.filepath);
        formData.append('image', fileStream, {
          filename: file.originalFilename || 'image.jpg',
          contentType: file.mimetype || 'image/jpeg',
        });
      }

      // Make request to backend
      const response = await fetch(backendUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      const data = await response.json();
      
      // Enhanced response handling
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          message: data.message || `Failed to ${method === 'POST' ? 'create' : 'update'} ad`,
          error: data.error
        });
      }
      
      return res.status(response.status).json({
        success: true,
        data: data.data,
        message: data.message || `Ad ${method === 'POST' ? 'created' : 'updated'} successfully`
      });

    } else if (method === 'DELETE') {
      // Simple DELETE request
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
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Admin ads API proxy error:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle formidable parsing errors
      if (error.message.includes('maxFileSize')) {
        statusCode = 400;
        errorMessage = 'File size exceeds 5MB limit';
      } else if (error.message.includes('ENOENT')) {
        statusCode = 400;
        errorMessage = 'File not found or invalid file path';
      } else if (error.message.includes('fetch')) {
        statusCode = 503;
        errorMessage = 'Backend service unavailable';
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : String(error) : undefined
    });
  }
}