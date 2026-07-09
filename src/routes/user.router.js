import { Router } from 'express'
import {registerUser} from '../controllers/user.controller.js'

const router = Router()

//router.post('/register', registerUser)
router.route('/register').post(registerUser) //This is especially useful when the same route supports multiple methods.

export default router