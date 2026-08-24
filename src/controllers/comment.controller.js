import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const getComment = asyncHandler(async (req, res)=> {
    const {videoId} = req.params
    
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const comment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        {
            $unwind: "$owner",
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner.username": 1,
                "owner.fullname": 1,
                "owner.avatar": 1,
            },
        },
        {
            $sort: {createdAt: -1}
        },            
        {
            $skip: ((page - 1) * limit)
        },
        {
            $limit: limit
        },
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comments fetched successfully"
        )
    );

})

const addComment = asyncHandler(async (req, res) => {
    const { userComment } = req.body
    const { videoId } = req.params

    if(!userComment?.trim()){
        throw new ApiError(400, "comment is empty");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const comment = await Comment.create({
        content: userComment.trim(),
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, comment , "comment uploaded successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { newComment } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const currentComment = await Comment.findById(commentId)

    if(!currentComment){
        throw new ApiError(404, "comment not found")
    }

    if(currentComment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: newComment
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, comment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(new ApiResponse(200, null, "comment deleted successfully"))
})

export {addComment, getComment,  updateComment, deleteComment}