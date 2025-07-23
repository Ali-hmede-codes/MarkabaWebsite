import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, API_HEADERS } from '../../../lib/api/config';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import { Readable } from 'stream';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let fields: any = {};
    let files: any = {};

    // Check if request is multipart/form-data
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Parse the multipart form data
      const form = formidable({
        multiples: false,
        keepExtensions: true,
      });

      const [parsedFields, parsedFiles] = await form.parse(req);
      fields = parsedFields;
      files = parsedFiles;
    } else {
      // Handle JSON or other content types
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      await new Promise((resolve) => {
        req.on('end', resolve);
      });
      
      try {
        fields = JSON.parse(body);
      } catch {
        fields = {};
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
      body: formData.getBuffer(),
      headers: {
        ...formData.getHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
     console.error('Error in posts API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}