import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // Save the refresh token in the database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // we don't want to validate the user schema before saving because we are not changing any other field except refreshToken

        return {accessToken, refreshToken}


    }catch (error) {
    console.error(error);
    throw new ApiError(500, error.message);
}
}

const registerUser = asyncHandler( async (req,res) => {
    // get the user data from the request body
    const {username, fullname, email, password} = req.body
    console.log('username:', username)

    // not empty fields
     
   /* 
    if(!username || !fullname || !email || !password) {
            throw new ApiError(400, 'Please fill all the fields')
        }// but their is a problem if user send " " space as a value it will be considered as a valid value.
    */
    if([username, fullname, email, password].some(field => field?.trim() === '')) {
        throw new ApiError(400, 'Please fill all the fields')
    }

    // check if user already exists
    const userExists = await User.findOne({
        $or: [{username}, {email}]
    })

    if(userExists) {
        throw new ApiError(400, 'User already exists')
    }

    //check if avatar and coverImage are uploaded
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath = ""
    if(req.files && req.files.coverImage && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
    }

    //console.log("req.files:", req.files)

    if(!avatarLocalPath){
        throw new ApiError(400, 'Please upload an avatar image')
    }

    //uploading avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null
    
    if(!avatar) {
        throw new ApiError(500, 'Error uploading avatar image')
    }

    // create the user
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
        coverImage: coverImage?.url || "",
        coverImagePublicId: coverImage?.public_id || ""
    })

    // remove password and refreshToken from the user object before sending the response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(500, 'Error creating user')
    }

    // send the response
    return res.status(201).json(
        new ApiResponse(201, createdUser, 'User registered successfully')
    )
})

const loginUser = asyncHandler( async (req,res) => {
    // get the user data from the request body
    const {username, email, password} = req.body
    
    // check if username or email is provided
    if(!(username || email)){
        throw new ApiError(400, 'Please provide username or email')
    }

    // find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, 'User not found')
    }

    // check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password) // we use "user" not "User" because the methods which we defined in the userSchema.methods are available on the instance of the model not on the model itself.

    if(!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid password')
    }

    // generate access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // remove password and refreshToken from the user object before sending the response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    if(!loggedInUser) {
        throw new ApiError(500, 'Error logging in user')
    }

    const options = {
        httpOnly: true, // to prevent XSS attacks
        secure: true // to ensure the cookie is only sent over HTTPS
    }

    // send the response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, 
            'User logged in successfully'
        )
    )
})

const logoutUser = asyncHandler( async (req,res) => {
    // remove the refresh token from the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true // return the updated document
        }
    )

    const options = {
        httpOnly: true, // to prevent XSS attacks
        secure: true, // to ensure the cookie is only sent over HTTPS
    }

    // send the response
return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {}, 
            'User logged out successfully'
        )
    )
})

const refreshAccessToken = asyncHandler( async (req, res)=>{
    const refToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!refToken){
        throw new ApiError(
            401,"refresh token not found"
        )
    }

    try {
        const decodedRefToken = jwt.verify(refToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedRefToken?._id)
    
        if(!user){
            throw new ApiError(401, 'User not found')
        }
    
        if(user.refreshToken !== refToken){
            throw new ApiError(401, 'Invalid refresh token')
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true, // to prevent XSS attacks
            secure: true, // to ensure the cookie is only sent over HTTPS
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                'Refresh token refreshed successfully'
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||'Invalid refresh token')
    }
})

const updatePassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Please provide old and new password")
    }

    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(401,"user not found");
    }

    const isCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isCorrect){
        throw new ApiError(400,"Incorrect Password");
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false}) 

    return res.status(200).json(
        new ApiResponse(200, {}, 'Password updated successfully')
    )
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            'User profile fetched successfully'
        )
    )
})

const updateUserDetails = asyncHandler( async(req, res) => {
    const {fullname, email} = req.body

    if (!fullname || !email) {
    throw new ApiError(400, "All fields are required")
}

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email}
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            'User details updated successfully'
        )
    )
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, 'Please upload an avatar image')
    }

    const currentuser = await User.findById(req.user?._id)

    if (currentuser?.avatarPublicId) {
        await deleteFromCloudinary(currentuser.avatarPublicId)

        console.log("Old avatar deleted from cloudinary")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)    

    if(!avatar.url) {
        throw new ApiError(500, 'Error uploading avatar on cloudinary')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
                avatarPublicId: avatar.public_id
            }
        },
        {new: true}
    ).select("-password -refreshToken")

        return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatar updated successfully ")
    )
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, 'Please upload an CoverImage image')
    }

    const currentuser = await User.findById(req.user?._id)

    if (currentuser?.coverImagePublicId) {
        await deleteFromCloudinary(currentuser.coverImagePublicId)

        console.log("Old cover image deleted from cloudinary")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(500, 'Error uploading coverImage on cloudinary')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
                coverImagePublicId: coverImage.public_id
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "coverImage updated successfully ")
    )
})

const deleteUser = asyncHandler( async(req, res) => {
    
    const user = await User.findByIdAndDelete(req.user?._id)

    if(!user){
            throw new ApiError(404, user, "User not found or already deleted" )
    }

    const options = {
        httpOnly: true, // to prevent XSS attacks
        secure: true, // to ensure the cookie is only sent over HTTPS
    }    

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
             { username: user.username},
            'User deleted successfully'
        )
    )
})

const getUserChannelProfile = asyncHandler( async(req, res) => {

    const {username}= req.params

    if(!username?.trim){
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedto"
            }
        },
        {
            $addFields: {
                subscribersCount: {$size: "$subscribers"},
                subscribedToCount: {$size: "$subscribedto"},
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel not found")
    }

    return res
    .status(200)
    .json( 
        new ApiResponse(200, channel[0], "channel profile fetched successfully")
    )
})

const getUserWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "creator",
                                foreignField: "_id",
                                as: "creator",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                creator: {
                                    $first: "$creator"
                                }
                            }
                        }
                    ]
                }
        }
    ])
    if(!user?.length){
        throw new ApiError(404, "user not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "user watch history fetched successfully")
    ) 
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, updatePassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, deleteUser, getUserChannelProfile, getUserWatchHistory }