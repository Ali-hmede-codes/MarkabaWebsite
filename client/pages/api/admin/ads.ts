import { NextApiRequest, NextApiResponse } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const formidable = require("formidable");
import * as fs from "fs";
import * as path from "path";

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
  res: NextApiResponse<ApiResponse>,
) {
  const { method } = req;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

  try {
    switch (method) {
      case "GET": {
        const { positions } = req.query;
        
        if (positions === 'true') {
          // Get ad positions
          const response = await fetch(`${backendUrl}/api/admin/administratorpage/ads/positions`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization || "",
            },
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Failed to fetch positions" }));
            return res.status(response.status).json({
              success: false,
              message: errorData.message || "Failed to fetch positions",
            });
          }

          const data = await response.json();
          return res.status(200).json(data);
        } else {
          // Get all ads for admin
          const response = await fetch(`${backendUrl}/api/admin/administratorpage/ads`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization || "",
            },
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Failed to fetch ads" }));
            return res.status(response.status).json({
              success: false,
              message: errorData.message || "Failed to fetch ads",
            });
          }

          const data = await response.json();
          return res.status(200).json(data);
        }
      }

      case "POST": {
        // Create new ad with file upload
        const form = formidable({
           uploadDir: path.join(process.cwd(), "public", "uploads", "ads"),
           keepExtensions: true,
           maxFileSize: 5 * 1024 * 1024, // 5MB
         });
         
         form.filter = ({ mimetype }: { mimetype: string }) => {
           return mimetype && mimetype.includes("image");
         };

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "ads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const [fields, files] = await form.parse(req);

        const title = Array.isArray(fields.title)
          ? fields.title[0]
          : fields.title;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position)
          ? fields.position[0]
          : fields.position;
        const width = Array.isArray(fields.width)
          ? fields.width[0]
          : fields.width;
        const height = Array.isArray(fields.height)
          ? fields.height[0]
          : fields.height;
        const start_date = Array.isArray(fields.start_date)
          ? fields.start_date[0]
          : fields.start_date;
        const end_date = Array.isArray(fields.end_date)
          ? fields.end_date[0]
          : fields.end_date;
        const is_active = Array.isArray(fields.is_active)
          ? fields.is_active[0]
          : fields.is_active;

        if (!title || !url || !position) {
          return res.status(400).json({
            success: false,
            message: "Title, URL, and position are required",
          });
        }

        let imagePath = "";
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const file = files.image[0];
          const fileName = `ad_${Date.now()}_${file.originalFilename}`;
          const newPath = path.join(uploadDir, fileName);

          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/ads/${fileName}`;
        }

        // Create FormData for backend submission
        const formData = new FormData();
        formData.append("title", title || "");
        formData.append("url", url || "");
        formData.append("position", position || "");
        if (fields.description) {
          const description = Array.isArray(fields.description)
            ? fields.description[0]
            : fields.description;
          formData.append("description", description || "");
        }
        if (width) formData.append("width", width || "");
        if (height) formData.append("height", height || "");
        if (start_date) formData.append("start_date", start_date || "");
        if (end_date) formData.append("end_date", end_date || "");
        formData.append(
          "is_active",
          is_active === "true" || is_active === "1" ? "true" : "false",
        );
        if (imagePath) formData.append("image_path", imagePath);

        const response = await fetch(`${backendUrl}/api/admin/administratorpage/ads`, {
          method: "POST",
          headers: {
            Authorization: req.headers.authorization || "",
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to create ad" }));
          return res.status(response.status).json({
            success: false,
            message: errorData.message || "Failed to create ad",
          });
        }

        const data = await response.json();
        return res.status(201).json(data);
      }

      case "PUT": {
        // Update existing ad
        const form = formidable({
          uploadDir: path.join(process.cwd(), "public", "uploads", "ads"),
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
        });
        
        form.filter = ({ mimetype }: { mimetype: string }) => {
          return mimetype && mimetype.includes("image");
        };

        const [fields, files] = await form.parse(req);

        const id = Array.isArray(fields.id) ? fields.id[0] : fields.id;
        const title = Array.isArray(fields.title)
          ? fields.title[0]
          : fields.title;
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        const position = Array.isArray(fields.position)
          ? fields.position[0]
          : fields.position;
        const width = Array.isArray(fields.width)
          ? fields.width[0]
          : fields.width;
        const height = Array.isArray(fields.height)
          ? fields.height[0]
          : fields.height;
        const start_date = Array.isArray(fields.start_date)
          ? fields.start_date[0]
          : fields.start_date;
        const end_date = Array.isArray(fields.end_date)
          ? fields.end_date[0]
          : fields.end_date;
        const is_active = Array.isArray(fields.is_active)
          ? fields.is_active[0]
          : fields.is_active;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: "Ad ID is required for update",
          });
        }

        let imagePath = Array.isArray(fields.current_image)
          ? fields.current_image[0]
          : fields.current_image;

        // Handle new image upload
        if (files.image && Array.isArray(files.image) && files.image[0]) {
          const uploadDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            "ads",
          );
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const file = files.image[0];
          const fileName = `ad_${Date.now()}_${file.originalFilename}`;
          const newPath = path.join(uploadDir, fileName);

          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/ads/${fileName}`;

          // Delete old image if it exists
          const currentImage = Array.isArray(fields.current_image)
            ? fields.current_image[0]
            : fields.current_image;
          if (currentImage && currentImage.startsWith("/uploads/ads/")) {
            const oldImagePath = path.join(
              process.cwd(),
              "public",
              currentImage,
            );
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }

        // Create FormData for backend submission
        const formData = new FormData();
        formData.append("title", title || "");
        formData.append("url", url || "");
        formData.append("position", position || "");
        if (fields.description) {
          const description = Array.isArray(fields.description)
            ? fields.description[0]
            : fields.description;
          formData.append("description", description || "");
        }
        if (width) formData.append("width", width || "");
        if (height) formData.append("height", height || "");
        if (start_date) formData.append("start_date", start_date || "");
        if (end_date) formData.append("end_date", end_date || "");
        formData.append(
          "is_active",
          is_active === "true" || is_active === "1" ? "true" : "false",
        );
        if (imagePath) formData.append("image_path", imagePath);

        const response = await fetch(`${backendUrl}/api/admin/administratorpage/ads/${id}`, {
          method: "PUT",
          headers: {
            Authorization: req.headers.authorization || "",
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to update ad" }));
          return res.status(response.status).json({
            success: false,
            message: errorData.message || "Failed to update ad",
          });
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      case "DELETE": {
        // Delete ad
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: "Ad ID is required",
          });
        }

        const response = await fetch(`${backendUrl}/api/admin/administratorpage/ads/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization || "",
          },
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to delete ad" }));
          return res.status(response.status).json({
            success: false,
            message: errorData.message || "Failed to delete ad",
          });
        }

        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`,
        });
    }
  } catch (error) {
    console.error("Admin Ads API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
