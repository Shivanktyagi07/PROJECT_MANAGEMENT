import express from "express";

import {
  login,
  logoutUser,
  registerUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  registerUsers,
} from "../controller/auth.controller.js";

import { userRegisterValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

//the flow this route like this ---> userRegisterValidator() --> validate --> registerUser means first it will go to userRegisterValidator to validate the request body, if there is no error it will go to validate middleware to check for validation errors, if there is no error it will go to registerUser controller to register the user. & we make userRegisterValidator() as a function but why not validate because userRegisterValidator() is a function that returns an array of validation rules, so we need to call it to get the array of validation rules. but validate is a middleware function that takes req, res, next as parameters, so we don't need to call it
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/register/bulk").post(registerUsers);

router.route("/login").post(userRegisterValidator(), validate, login);

router.route("/logout").post(verifyJWT, logoutUser);

// Get all users (🔒 protected - only logged-in users or admins can see)
router.route("/users").get(verifyJWT, getAllUsers);

// Get single user by ID
router.route("/users/:id").get(verifyJWT, getUserById);

// Update user by ID
router.route("/users/:id").put(verifyJWT, updateUser);

// Delete user by ID
router.route("/users/:id").delete(verifyJWT, deleteUser);
export default router;
