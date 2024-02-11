import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try
    {
        const user = await User.findById(userId)   
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens.userController")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message:"router works fine"
    // })

    //1get details
    //2validation not empty?
    //3check if already exists?
    //4upload image but avatar check?
    //5upload to clodinary
    //6create user obj - create entry in db
    //7remove pass and refresh token from response
    //8check for user creation?
    //9retrn res

    //************** 1 *********
    const { fullname, username, email, password } = req.body
    // console.log("email is:", email);
    // console.log("Body is:", req.body);

    // if (fullname === "") {
    //     throw new ApiError(400,"fullname required")
    // }
    //************** 2 *********
    if (
        [fullname, email, password, username].some((field) =>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400,"Missing required field")
    }

    //************** 3 *********
    const existedUser = await User.findOne({
        $or:[{email}, {username}]
    })
    if (existedUser) {
        throw new ApiError(409,"User exists by email or username")
    }
    
    //************** 4 *********
    // console.log("Multer response for files:",req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files?.coverImage[0]?.path;
    }
    if (!avatarLocalPath) throw new ApiError(400, "avatar required");

    //************** 5 *********

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

  


    if (!avatar) throw new ApiError(400, "avatar required");
    
    //************** 6 *********
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    //************** 7 *********
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    //************** 8 *********
    if (!userCreated) {
        throw new ApiError(500,"User not created, something went wrong while registering!!")
    }

    //************** 9 *********

    return res.status(201).json(
        new ApiResponse(200,userCreated,"User registerred successfully")
    )

})



const loginUser = asyncHandler(async (req, res) =>
{
    //get username/email and password
    //check if user exists.
    //check password
    //generate Access and refresh token
    //set toekns into secure cookie
    //return response
    
    const { email, username, password } = req.body
    console.log("Body while logging in", req.body )
    console.log("username while logging in", req.body.username )
    console.log("paasword while logging in", req.body.password )
    if (!(username || email)) throw new ApiError(400, "username/email required");
    
    const user = await User.findOne({
        $or:[{username}, {email}]
    })

    if (!user) throw new ApiError(400, "user doesn't exist !");

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) throw new ApiError(400, "invalid Credentials !");

    const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")
    
    const optionsCookie = {
        httpOnly: true,
        secure:true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, optionsCookie)
        .cookie("refreshToken",refreshToken, optionsCookie)
        .json(
            new ApiResponse(200,
                {
                    user:loggedInUser, accessToken, refreshToken
                },
                    "User logged in successfully"
            )
        )

})


const logOutUser = asyncHandler(async (req, res) => {
    console.log("LOGOUT METHoD:---------")
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incommingRefreshToken) throw new ApiError(401, "unauthorized request no token")
    
   try {
        const decodedToken = await jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token while refreshng");
        } 
        
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
            .status(200)
            .cookie("accessToken",accessToken, options)
            .cookie("refreshToken",newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        accessToken,refreshToken:newRefreshToken
                    },
                    "Access Token refreshed"
                )
            )
   }
   catch (error)
   {
        throw new ApiError(401,error?.message ||"Invalid refresh token catch") 
   }
})

export {registerUser, loginUser, logOutUser, refreshAccessToken}