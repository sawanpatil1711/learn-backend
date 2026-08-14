import { Router } from "express";

import { verifyJWT } from "../middileware/auth.middileware.js";
import { upload } from "../middileware/multer.middileware.js";

const router = Router()

router.use(verifyJWT)



export default router