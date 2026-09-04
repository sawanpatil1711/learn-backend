import { Router } from "express";
import { verifyJWT } from "../middileware/auth.middileware.js";
import { getComment, addComment, deleteComment,updateComment } from "../controllers/comment.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").get(getComment).post(addComment)

router.route("/:commentId").patch(updateComment).delete(deleteComment)

export default router