import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler( async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is not valid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const existingLike = await Like.findOne(
        {
            video : videoId,
            likedBy : req.user._id
        }
    )

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
                new ApiResponse(
                        200,
                        null,
                        "video unliked successfully"
                    )
            )
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            like,
            "video liked successfully"
        )
    )
})

const toggleCommentLike = asyncHandler( async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "commentId is not valid")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    const existingLike = await Like.findOne(
        {
            comment : commentId,
            likedBy : req.user._id
        }
    )    

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
                new ApiResponse(
                        200,
                        null,
                        "comment unliked successfully"
                    )
            )
    }

    const like = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            like,
            "comment liked successfully"
        )
    )
})

const toggleTweetLike = asyncHandler( async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    const existingLike = await Like.findOne(
        {
            tweet : tweetId,
            likedBy : req.user._id
        }
    )

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
                new ApiResponse(
                        200,
                        null,
                        "tweet unliked successfully"
                    )
            )
    }

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            like,
            "tweet liked successfully"
        )
    )    
})

const getAllVideoLike = asyncHandler( async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: {$exists: true}
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "fetch All the videos liked by you successfully"
        )
    )
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getAllVideoLike}