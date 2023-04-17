import express from "express";
import { body } from "express-validator";
import User from "../models/user.js";
import { signup, login, getUser } from "../controllers/auth.js";

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 6 }),
    body("name").trim().not().isEmpty(),
  ],
  signup
);
router.post("/login", login);
router.get("/:userId", getUser);

export default router;
