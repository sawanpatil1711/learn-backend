import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is invalid")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "channel is not found")
    }

    if(channelId === req.user?._id.toString()){
        throw new ApiError(400, "you cannot subscride your self")
    }


    const existingSubscription = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id),
                channel: new mongoose.Types.ObjectId(channelId)
            }
        }
    ])

    if(existingSubscription.length>0){
        await Subscription.findByIdAndDelete(existingSubscription[0]._id)

         return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Channel unsubscribed successfully"
            )
        )
    } 

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            subscription,
            "Channel subscribed successfully"
        )
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is invalid")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "channel not found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            _id: 0
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "subscriberId is invalid")
    }

    const subscriber = await User.findById(subscriberId)

    if(!subscriber){
        throw new ApiError(404, "subscriber not found")
    }

    const channels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            _id: 0
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully"
        )
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}