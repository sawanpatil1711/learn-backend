import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const uploadVideo = asyncHandler(async (req, res)=>{
    const {title, description} = req.body

    const isPublic = req.body?.isPublic === 'false' ? false : true

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video?.secure_url || !thumbnail?.secure_url) {
        throw new ApiError(500, "Error uploading video or thumbnail to Cloudinary");
    }

    const videoData = await Video.create({
        videoFile: video.secure_url,
        videoPublicId: video.public_id,
        thumbnail: thumbnail.secure_url,
        thumbnailPublicId: thumbnail.public_id,
        title,
        description,
        duration: video.duration,
        isPublic,
        creator: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, videoData, "Video uploaded successfully"))
})

const getAllVideos = asyncHandler(async (req, res)=>{
    const {page = 1, limit = 10, query, sortBy="createdAt", sortType="desc", userId, username} = req.query;

    try {

        const filter = {
            isPublic: true,
        }

        if(query){
            filter.title = {
                $regex: query,
                $options: "i"
            };
        }

        if(username){
            const user = await User.findOne({username});
            if(!user){
                throw new ApiError(404, "User not found");
            }
            filter.creator = user._id;
        } else if(userId){
            filter.creator = userId;
        }

        const videos = await Video.find(filter)
          .populate("creator", "username avatar")
          .limit(Number(limit))
          .sort({ [sortBy]: sortType === "asc" ? 1 : -1 })
          .skip((Number(page) - 1) * Number(limit));
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    page: Number(page),
                    limit: Number(limit),
                },
                "Videos fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Error fetching videos");   
    }
})

const getVideoById = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const deleteVideoById = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
    
    try {
        const video = await Video.findById(videoId)

        if(!video){
        throw new ApiError(404, "Video not found")
        }

        if(video.creator.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video")
        }

        // Delete video and thumbnail from Cloudinary
        await deleteFromCloudinary(video.videoPublicId, "video")
        await deleteFromCloudinary(video.thumbnailPublicId, "image")

        await Video.findByIdAndDelete(videoId)
        return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Error deleting video");
    }
})

const updateVideoById = asyncHandler(async (req, res)=>{
    const {videoId} = req.params

    const currentVideo = await Video.findById(videoId)

    if(!currentVideo){
        throw new ApiError(404, "Video not found")
    }

    if(currentVideo.creator.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const {title, description, isPublic} = req.body

    // if(!title?.trim() || !description?.trim()){
    //     throw new ApiError(400, "Title and description cannot be empty")
    // }    

    const thumbnailLocalPath = req.file?.path;

    let thumbnail = null;

    if(thumbnailLocalPath){

        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnail?.secure_url || !thumbnail?.public_id)
        {
            throw new ApiError(500, "Error uploading thumbnail to Cloudinary")

        } else {
            await deleteFromCloudinary(currentVideo.thumbnailPublicId, "image")
        }    
    }    

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title?.trim() || currentVideo.title,
                description: description?.trim() || currentVideo.description,
                isPublic: isPublic !== undefined ? isPublic === 'true' : currentVideo.isPublic,
                thumbnail: thumbnail?.secure_url || currentVideo.thumbnail,
                thumbnailPublicId: thumbnail?.public_id || currentVideo.thumbnailPublicId
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))

})

export {uploadVideo, getAllVideos, getVideoById, deleteVideoById, updateVideoById}



    // const isPublic = req.body?.isPublic === 'false' ? false : true