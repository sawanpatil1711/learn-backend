import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

const getAllTweet = asyncHandler( async (req, res) => {

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const tweets = await Tweet.aggregate([
        {
            $lookup : {
                from: 'users',
                localField : 'owner',
                foreignField : '_id',
                as : 'owner'
            }
        },
        {
            $unwind : '$owner'
        },
        {
            $project: {
                content : 1,
                createdAt : 1,
                'owner.username' : 1,
                'owner.fullname': 1,
                'owner.avatar': 1
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        { $skip: ((page - 1) * limit)},
        { $limit: limit }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "tweet fetched successfully"
        )
    );    
})

const addTweet = asyncHandler( async (req, res)=>{

    const { userTweet } = req.body
    
    if(!userTweet?.trim()){
        throw new ApiError(400, 'tweet is empty')
    }

    const tweet = await Tweet.create({
        content: userTweet.trim(),
        owner: req.user._id
    })    

    return res
    .status(201)
    .json(
        new ApiResponse(201, tweet, "tweet uploaded successfully")
    )    
})

const updateTweet = asyncHandler( async(req, res)=> {
    const { tweetId } = req.params
    const { newTweet } = req.body

    if(!newTweet?.trim()){
        throw new ApiError(400, 'tweet is empty')
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
    }

    const currentTweet = await Tweet.findById(tweetId)

    if(!currentTweet){
        throw new ApiError(404, "tweet not found")
    }

    if(currentTweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: newTweet.trim()
            }
        },
        { new: true }
    )

    return res.status(200).json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler( async(req, res)=> {
    const { tweetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, " tweet not found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
    .json(
        new ApiResponse(200, null, "tweet deleted successfully")
    )
})

export {getAllTweet, addTweet, updateTweet, deleteTweet}