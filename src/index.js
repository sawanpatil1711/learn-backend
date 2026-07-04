//require('dotenv').config({path: './.env'}) use to import .env variable in nodejs

import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
});

connectDB()  //connectDB is async function that returns a promise, so we can use .then() and .catch() to handle the success and error cases respectively.
.then(()=>{
    app.on("error", (error)=>{
        console.error("Error occurred in the app:", error);
    })
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is listening at port ${process.env.PORT}`);
    })
    // console.log(app)
})
.catch((error)=>{
    console.log("Error connecting to MongoDB:", error);
})








/*
import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';
import express from "express";
const app = express();
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}${DB_NAME}`);
        app.on("error", (error) => {
            console.error("Error:", error);
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is listening at port ${process.env.PORT}`);
        });
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()// IIFE
*/