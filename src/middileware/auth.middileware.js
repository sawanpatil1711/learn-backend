import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        
        const token = req.cookies?.accessToken || req.headers?.authorization?.replace('Bearer ', '') // Get the access token from the request cookies or headers. 

        if(!token){
            throw new ApiError(401, 'Access token is missing')
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) // Verify the access token using the secret key and decode the token

        const user = await User.findById(decoded?._id).select("-password -refreshToken") // Find the user in the database using the decoded user ID

        if(!user){
            throw new ApiError(401, 'User not found')
        }

        req.user = user // Attach the user object to the request object for further use in the route handler

        next() // Call the next middleware or route handler
        
    } catch (error) {
        throw new ApiError(500, error.message || 'Error in auth middleware')
    }
})