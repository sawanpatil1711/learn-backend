import { Router } from "express";
import { toggleCommentLike, toggleTweetLike, toggleVideoLike, getAllVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middileware/auth.middileware.js";
import { upload } from "../middileware/multer.middileware.js";

const router = Router()

router.use(verifyJWT)

router.route("/v/:videoId").post(toggleVideoLike)

router.route("/c/:commentId").post(toggleCommentLike)

router.route("/t/:tweetId").post(toggleTweetLike)

router.route("/videos").get(getAllVideoLike)

export default router