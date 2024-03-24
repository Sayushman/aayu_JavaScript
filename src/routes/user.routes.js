import { Router } from "express";

import { logoutUser, registerUser, loginUser, refreshAccessToken, 
         changeCurrentPassword, getCurrentUser, updateAccountDetails,
         updateUserAvatar, updateUserCoverImage, getUserChhanelProfile,
         getWatchedHistory } from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../controllers/auth.middleware.js";
import { verify } from "jsonwebtoken";

const router = Router()

router.route("/register").post(
    upload.fields([

    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
    )

    router.route("/login").post(loginUser)

    // ?secured routes
    router.route("/logout").post(verifyJWT, logoutUser)

    router.route("/refresh-token").post(refreshAccessToken)

    router.route("/change-password").post(verifyJWT, changeCurrentPassword)

    router.route("/current-user").get(verifyJWT, getCurrentUser)                        //get

    router.route("/update-account").patch(verifyJWT, updateAccountDetails)              //patch

    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)         //upload

    router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)

    router.route("/c/:username").get(verifyJWT, getUserChhanelProfile)

    router.route("/history").get(verify, getWatchedHistory)





export default router;