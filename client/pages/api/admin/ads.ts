import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
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
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  try {
    switch (method) {
      case 'GET': {
        // Get all ads for admin
        const response = await fetch(`${backendUrl}/api/admin/ads`, {
          method: 'GET',
          headers: {
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
        // Create new ad with file upload
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public', 'uploads', 'ads'),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          filter: ({ mimetype }) => {
            return mimetype && mimetype.includes('image');
          },
        });

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const [fields, files] = await form.parse(req);
        
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position) ? fields.position[0] : fields.position;
        const width = Array.isArray(fields.width) ? fields.width[0] : fields.width;
        const height = Array.isArray(fields.height) ? fields.height[0] : fields.height;
        const start_date = Array.isArray(fields.start_date) ? fields.start_date[0] : fields.start_date;
        const end_date = Array.isArray(fields.end_date) ? fields.end_date[0] : fields.end_date;
        const is_active = Array.isArray(fields.is_active) ? fields.is_active[0] : fields.is_active;

        if (!title || !url || !position) {
          return res.status(400).json({
            success: false,
            message: 'Title, URL, and position are required'
          });
        }

        let imagePath = '';
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const file = files.image[0];
          const fileName = `ad_${Date.now()}_${file.originalFilename}`;
          const newPath = path.join(uploadDir, fileName);
          
          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/ads/${fileName}`;
        }

        const adData = {
          title,
          url,
          position,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          start_date: start_date || null,
          end_date: end_date || null,
          is_active: is_active === 'true' || is_active === '1',
          image_path: imagePath
        };

        const response = await fetch(`${backendUrl}/api/admin/ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adData)
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(201).json(data);
      }

      case 'PUT': {
        // Update existing ad
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public', 'uploads', 'ads'),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          filter: ({ mimetype }) => {
            return mimetype && mimetype.includes('image');
          },
        });

        const [fields, files] = await form.parse(req);
        
        const id = Array.isArray(fields.id) ? fields.id[0] : fields.id;
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position) ? fields.position[0] : fields.position;
        const width = Array.isArray(fields.width) ? fields.width[0] : fields.width;
        const height = Array.isArray(fields.height) ? fields.height[0] : fields.height;
        const start_date = Array.isArray(fields.start_date) ? fields.start_date[0] : fields.start_date;
        const end_date = Array.isArray(fields.end_date) ? fields.end_date[0] : fields.end_date;
        const is_active = Array.isArray(fields.is_active) ? fields.is_active[0] : fields.is_active;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Ad ID is required for update'
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

          // Delete old image if it exists
          const currentImage = Array.isArray(fields.current_image) ? fields.current_image[0] : fields.current_image;
          if (currentImage && currentImage.startsWith('/uploads/ads/')) {
            const oldImagePath = path.join(process.cwd(), 'public', currentImage);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }

        const adData = {
          title,
          url,
          position,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          start_date: start_date || null,
          end_date: end_date || null,
          is_active: is_active === 'true' || is_active === '1',
          image_path: imagePath
        };

        const response = await fetch(`${backendUrl}/api/admin/ads/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adData)
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      case 'DELETE': {
        // Delete ad
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Ad ID is required'
          });
        }

        const response = await fetch(`${backendUrl}/api/admin/ads/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
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