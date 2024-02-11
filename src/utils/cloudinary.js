import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";


         
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) return null;
        //upload file
        const response = await cloudinary.uploader.upload(localPath, {
            resource_type:"auto"
        })
        //file uploaded
        fs.unlinkSync(localPath) //remove the locally saved temp file as uploadation.

        // console.log("file uploaded on cloudinary:", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localPath) //remove the locally saved temp file as failed uploadation.
    }
       
}


const unlinkImage = async (localPath) => {
    if (!localPath) {
        throw new ApiError(400, "Not local file found !");
    }
    fs.unlinkSync(localPath) //remove the locally saved temp file .
}


export {uploadOnCloudinary, unlinkImage}
  

