import { Router } from "express"
import { createProduct } from "../controllers/products.controllers.js";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
.route("/admin/create")
.post(
    verifyJWT,
    authorizedRoles("Admin"),
    upload.array("images",5),
    createProduct
)



export default router;