import { NextApiRequest, NextApiResponse } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const formidable = require('formidable');
import fs from 'fs';
import path from 'path';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
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
  const { method } = req;
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api/v2';
  
  // Get auth token from cookies
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Authentication required',
      error: 'NO_TOKEN'
    });
  }

  try {
    switch (method) {
      case 'GET': {
        const { positions } = req.query;
        
        if (positions === 'true') {
          // Get ad positions
          const backendUrl = `${API_BASE_URL}/admin/administratorpage/ads/positions`;
          
          const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();
          return res.status(response.status).json(data);
        } else {
          // Get all ads for admin
          const backendUrl = `${API_BASE_URL}/admin/administratorpage/ads`;
          
          const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();
          return res.status(response.status).json(data);
        }
      }

      case 'POST': {
        // Create new ad with file upload
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public', 'uploads', 'ads'),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          filter: (part: any) => {
            return part.mimetype ? part.mimetype.includes('image') : false;
          },
        });

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const [fields, files] = await form.parse(req);

        // Extract form fields
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position) ? fields.position[0] : fields.position;
        const end_date = Array.isArray(fields.end_date) ? fields.end_date[0] : fields.end_date;
        const is_active = Array.isArray(fields.is_active) ? fields.is_active[0] : fields.is_active;

        if (!title || !url || !position) {
          return res.status(400).json({
            success: false,
            message: 'Title, URL, and position are required',
          });
        }

        // Handle image upload
        let imagePath = '';
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const file = files.image[0];
          const fileName = `ad_${Date.now()}_${file.originalFilename}`;
          const newPath = path.join(uploadDir, fileName);

          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/ads/${fileName}`;
        }

        // Create FormData for backend submission
        const formData = new FormData();
        formData.append('title', title || '');
        formData.append('url', url || '');
        formData.append('position', position || '');
        if (description) formData.append('description', description || '');
        if (end_date) formData.append('end_date', end_date || '');
        formData.append('is_active', is_active === 'true' || is_active === '1' ? 'true' : 'false');
        if (imagePath) formData.append('image_path', imagePath);

        const backendUrl = `${API_BASE_URL}/admin/administratorpage/ads`;
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        return res.status(response.status).json(data);
      }

      case 'PUT': {
        // Update existing ad
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public', 'uploads', 'ads'),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          filter: (part: any) => {
            return part.mimetype ? part.mimetype.includes('image') : false;
          },
        });

        const [fields, files] = await form.parse(req);

        const id = Array.isArray(fields.id) ? fields.id[0] : fields.id;
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position) ? fields.position[0] : fields.position;
        const end_date = Array.isArray(fields.end_date) ? fields.end_date[0] : fields.end_date;
        const is_active = Array.isArray(fields.is_active) ? fields.is_active[0] : fields.is_active;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Ad ID is required for update',
          });
        }

        let imagePath = Array.isArray(fields.current_image) ? fields.current_image[0] : fields.current_image;

        // Handle new image upload
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const file = files.image[0];
          const fileName = `ad_${Date.now()}_${file.originalFilename}`;
          const newPath = path.join(uploadDir, fileName);

          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/ads/${fileName}`;
        }

        // Create FormData for backend submission
        const formData = new FormData();
        formData.append('title', title || '');
        formData.append('url', url || '');
        formData.append('position', position || '');
        if (description) formData.append('description', description || '');
        if (end_date) formData.append('end_date', end_date || '');
        formData.append('is_active', is_active === 'true' || is_active === '1' ? 'true' : 'false');
        if (imagePath) formData.append('image_path', imagePath);

        const backendUrl = `${API_BASE_URL}/admin/administratorpage/ads/${id}`;
        
        const response = await fetch(backendUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        return res.status(response.status).json(data);
      }

      case 'DELETE': {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Ad ID is required for deletion',
          });
        }

        const backendUrl = `${API_BASE_URL}/admin/administratorpage/ads/${id}`;
        
        const response = await fetch(backendUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        return res.status(response.status).json(data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Admin ads API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}