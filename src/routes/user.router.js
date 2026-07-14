import { Router } from 'express'
import {registerUser} from '../controllers/user.controller.js'
import {upload} from '../middileware/multer.middileware.js'

const router = Router()

//router.post('/register', registerUser)
router.route('/register').post(
    // Use multer middleware to handle file uploads for avatar and coverImage
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

export default router