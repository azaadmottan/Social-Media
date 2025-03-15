import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import fs from "fs";
import { config } from "../config/config.js";

cloudinary.config({
  cloud_name: config.cloudName,
  api_key: config.apiKey,
  api_secret: config.apiSecret,
});

// Upload Function
export const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "uploads",
    });

    // Delete local file after successful upload
    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkError) {
      console.error("\n❌ Error deleting local file:", unlinkError);
    }

    return response;
  } catch (error) {
    console.error("\n❌ Failed to upload file on Cloudinary:", error);

    // Ensure local file cleanup even if upload fails
    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkError) {
      console.error("\n❌ Error deleting local file:", unlinkError);
    }

    return null;
  }
};

// Delete Function
export const deleteOnCloudinary = async (public_id: string, resource_type: "image" | "video" | "raw" = "image"): Promise<UploadApiResponse | null> => {
  try {
    if (!public_id) return null;

    const response = await cloudinary.uploader.destroy(public_id, { resource_type });

    return response;
  } catch (error) {
    console.error("\n❌ Failed to delete file on Cloudinary:", error);
    return null;
  }
};