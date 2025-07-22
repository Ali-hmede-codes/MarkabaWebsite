import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, API_HEADERS } from '../../../lib/api/config';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import { Readable } from 'stream';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
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

    // Get authorization token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/admin/administratorpage/posts`, {
      method: 'POST',
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
  } catch (error) {
    console.error('Error in posts API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}