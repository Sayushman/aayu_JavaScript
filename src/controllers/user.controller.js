import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadsOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Jwt } from "jsonwebtoken";

const generateAccessTokenAndRefereshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")

    }
}


const registerUser = asyncHandler( async (req, res) => {
        const {fullname, email, username, password } = req.body
        console.log("email: ", email);

        if (
            [fullname, email, username, password].some((field) => 
            field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const existsUser = await User.findOne({
            $or: [{username}, {email}]
        })

        if (existsUser) {
            throw new ApiError(409, "User with eamil or username already exists")
        }


        const avatarLocalpath = req.files?.avatar[0]?.path
        const coverImageLocalpath = req.files?.coverImage[0]?.path

        // error

        console.log(req.files);

        if (!avatarLocalpath) {
            throw new ApiError(400, "Avatar_local file is required")
        }

        console.log("Avatar local path: after condition check ", avatarLocalpath);
        
        // error

        const avatar = await uploadsOnCloudinary(avatarLocalpath);
        const coverImage = await uploadsOnCloudinary(coverImageLocalpath);

        
        console.log("not done", avatarLocalpath)

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }

        console.log("upto there is it working correct")



        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong when registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "user registered successfully")
        )
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid Password")
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefereshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
        "user logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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

    return res.status(200).clearCookie("accessToken", options)
                           .clearCookie("refreshToken", options)
                           .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    
    try {
        const decodedToken = Jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefereshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse (
                200, {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
        
    }

    


})

export { registerUser, loginUser, logoutUser, refreshAccessToken }