import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET, 
//   secure: process.env.CLOUDINARY_SECURE
});

const uploadsOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url);
        return response;

    } catch (error) {
        // Handle errors
        console.error("Error uploading file to Cloudinary:", error);
        
        // Ensure that the local file is deleted only if an error occurs during the upload process
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;

    }
}

export {uploadsOnCloudinary}