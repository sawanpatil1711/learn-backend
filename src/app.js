import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'))
app.use(cookieParser())

// Importing the user router and mounting it on the /api/v1/users path
import userRouter from './routes/user.router.js'
import videoRouter from './routes/video.router.js'
import commentRouter from './routes/comment.router.js'
import likeRouter from './routes/like.router.js'
import playlistRouter from './routes/playlist.router.js'
import tweetRouter from './routes/tweet.router.js'
import subscriptionRouter from './routes/subscription.router.js'

app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/likes', likeRouter)
app.use('/api/v1/playlists', playlistRouter)
app.use('/api/v1/tweets', tweetRouter)
app.use('/api/v1/subscriptions', subscriptionRouter)

export { app }