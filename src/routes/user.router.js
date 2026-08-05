import { Router } from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken } from '../controllers/user.controller.js'
import { upload } from '../middileware/multer.middileware.js'
import { verifyJWT } from '../middileware/auth.middileware.js'

const router = Router()

//router.post('/register', registerUser)
router.route('/register').post(
    // Use multer middleware to handle file uploads for avatar and coverImage. multer will parse the incoming request and extract the files, making them available in req.files. The upload.fields() method allows you to specify multiple fields for file uploads, each with its own configuration. In this case, we are expecting an 'avatar' field and a 'coverImage' field, each allowing a maximum of one file to be uploaded. 
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
) //This is especially useful when the same route supports multiple methods. like get, post, put, delete, etc.

router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh').post(refreshAccessToken)

export default router