import { Router } from "express";

import { verifyJWT } from "../middileware/auth.middileware.js";

import { getAllTweet, addTweet, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.use(verifyJWT)

router.route('/').get(getAllTweet).post(addTweet)

router.route('/:tweetId').patch(updateTweet).delete(deleteTweet)

export default router