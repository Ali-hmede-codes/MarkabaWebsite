import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const logoUploadDir = path.join(uploadDir, 'logos');
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: logoUploadDir,
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      filter: ({ mimetype }) => {
        return mimetype?.startsWith('image/') || false;
      },
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'logo';
    const extension = path.extname(originalName);
    const newFilename = `logo-${timestamp}${extension}`;
    const newPath = path.join(logoUploadDir, newFilename);
    
    // Move file to new location with unique name
    fs.renameSync(file.filepath, newPath);
    
    // Return the public URL
    const publicUrl = `/uploads/logos/${newFilename}`;
    
    res.status(200).json({
      success: true,
      filePath: publicUrl,
      filename: newFilename,
      originalName: originalName,
      size: file.size,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}