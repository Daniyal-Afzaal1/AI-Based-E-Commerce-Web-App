import { Router } from "express"
import { registerUser, loginUser, getUser, logoutUser } from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, authorizedRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.single("avatar"),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/me").get(verifyJWT, getUser);
router.route("/logout").post(verifyJWT, logoutUser)

export default router;