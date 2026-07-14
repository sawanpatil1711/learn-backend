import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler( async (req,res) => {
    // get the user data from the request body
    const {username, fullname, email, password} = req.body
    console.log("username :", username)

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, 'Please upload an avatar image')
    }

    //uploading avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
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
        coverImage: coverImage?.url || null
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

export { registerUser }