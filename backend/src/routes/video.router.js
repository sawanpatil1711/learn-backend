import { Router } from "express";
import { uploadVideo, getAllVideos, getVideoById, deleteVideoById, updateVideoById } from "../controllers/video.controller.js";
import { verifyJWT } from "../middileware/auth.middileware.js";
import { upload } from "../middileware/multer.middileware.js";

const router = Router()

router.use(verifyJWT)

router.route('/uploadVideo').post(upload.fields([
    {
        name: 'videoFile',
        maxCount: 1
    },
    {
        name: 'thumbnail',
        maxCount: 1
    }
]),uploadVideo)

router.route('/').get(getAllVideos)

router.route('/:videoId')
.delete(deleteVideoById)
.get(getVideoById)
.patch(upload.single('thumbnail'),updateVideoById)


export default router