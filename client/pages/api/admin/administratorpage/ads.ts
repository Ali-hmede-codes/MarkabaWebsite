import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method, query } = req;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // Extract auth token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    switch (method) {
      case 'GET': {
        // Forward query parameters to backend
        const queryParams = new URLSearchParams();
        
        Object.entries(query).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            queryParams.append(key, value);
          }
        });

        const url = `${backendUrl}/api/admin/ads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      case 'POST': {
        // Handle form data for ad creation with image upload
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public/uploads/ads'),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
        });

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public/uploads/ads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const [fields, files] = await form.parse(req);
        
        // Prepare form data for backend
        const formData = new FormData();
        
        // Add text fields
        Object.entries(fields).forEach(([key, value]) => {
          if (value && Array.isArray(value)) {
            formData.append(key, value[0]);
          } else if (value) {
            formData.append(key, value as string);
          }
        });

        // Add image file if present
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const file = files.image[0];
          const fileStream = fs.createReadStream(file.filepath);
          formData.append('image', fileStream as any, file.originalFilename || 'image');
        }

        const response = await fetch(`${backendUrl}/api/admin/ads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(201).json(data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Admin Ads API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}