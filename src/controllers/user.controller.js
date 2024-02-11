import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log("email is:", email);

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
    console.log("Multer response for files:",req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "avatar required");

    //************** 5 *********

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) throw new ApiError(400, "avatar required");
    
    //************** 6 *********
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase
    })

    //************** 7 *********
    const userCreated = await User.findById(user._id).select(
        "-password -refreshTokens"
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


export {registerUser}