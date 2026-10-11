import { Router } from "express"
import {
    registerUser,
    loginUser,
    getUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    updatePassword,
    updateProfile
} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, authorizedRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.single("avatar"),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/me").get(verifyJWT, getUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").patch(resetPassword);
router.route("/password/update").patch(verifyJWT,updatePassword);
router.route("/profile/update").patch(verifyJWT,upload.single("avatar"), updateProfile);

export default router;