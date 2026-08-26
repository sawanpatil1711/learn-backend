import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"

const createPlaylist = asyncHandler( async (req, res) => {
    const {name, description} = req.body

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400, "playlist name and description are required")
    }

    const playlist = await Playlist.create(
        {
            name: name.trim(),
            description: description.trim(),
            owner: req.user._id
        }
    )

    return res.status(201).json( new ApiResponse(201, playlist, " playlist created successfully"))
})

const getUsersPlaylist = asyncHandler( async (req, res) => {


    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])

    return res.status(200).json( new ApiResponse(200, playlist, "all the playlist created by you"))
})

const getPlaylistById = asyncHandler( async (req, res) => {
    const {playlistId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "creator",
                            foreignField: "_id",
                            as: "creator",
                            pipeline:[
                                {
                                    $project:{
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            creator: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videos"
        },
    ])

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    return res.status(200).json( new ApiResponse(200, playlist, "playlist fatch successfully"))
})

const addToPlaylist = asyncHandler( async (req, res) => {
    const { videoId, playlistId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "You are not authorized to add video to this playlist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        { new: true }
    )

    return res.status(200).json( 
        new ApiResponse(
            200,
            updatedPlaylist,
            "video add to playlist successfully"
        )
    )
    
})

const removeFromPlaylist = asyncHandler( async (req, res) => {
    const { videoId, playlistId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "You are not authorized to add video to this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    )

    return res.status(200).json( 
        new ApiResponse(
            200,
            updatedPlaylist,
            "video remove from playlist successfully"
        ))
})

const updatePlaylist = asyncHandler( async (req, res) => {
    const { playlistId } = req.params
    const { name, description} = req.body

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
    }

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400, "playlist name and description are required")
    }

    const currentPlaylist = await Playlist.findById(playlistId)

    if(!currentPlaylist){
        throw new ApiError(404, "playlist not found")
    }

    if(currentPlaylist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "You are not authorized to update this playlist")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name.trim(),
                description: description.trim()
            }
        },
        { new: true }
    )

    return res.status(200).json( new ApiResponse(200, playlist, "playlist updated successfully"))

})

const deletePlaylist = asyncHandler( async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
    }
    
    const currentPlaylist = await Playlist.findById(playlistId)

    if(!currentPlaylist){
        throw new ApiError(404, "playlist not found")
    }

    if(currentPlaylist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json( new ApiResponse(200, null, "playlist deleted successfully"))
})

export { createPlaylist, getUsersPlaylist, getPlaylistById, addToPlaylist, removeFromPlaylist, updatePlaylist, deletePlaylist}