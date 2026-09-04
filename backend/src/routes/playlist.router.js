import { Router } from "express";
import { createPlaylist, getUsersPlaylist, getPlaylistById, addToPlaylist,removeFromPlaylist, updatePlaylist,deletePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middileware/auth.middileware.js";

const router = Router()

router.use(verifyJWT)

router.route("/createPlaylist").post(createPlaylist)

router.route("/").get(getUsersPlaylist)

router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeFromPlaylist)


export default router