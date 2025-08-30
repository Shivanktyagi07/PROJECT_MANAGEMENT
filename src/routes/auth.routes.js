import express from "express";
import { login, registerUser } from "../controller/auth.controller.js";
import { userRegisterValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = express.Router();

//the flow this route like this ---> userRegisterValidator() --> validate --> registerUser means first it will go to userRegisterValidator to validate the request body, if there is no error it will go to validate middleware to check for validation errors, if there is no error it will go to registerUser controller to register the user. & we make userRegisterValidator() as a function but why not validate because userRegisterValidator() is a function that returns an array of validation rules, so we need to call it to get the array of validation rules. but validate is a middleware function that takes req, res, next as parameters, so we don't need to call it
router.route("/register").post(userRegisterValidator(), validate, registerUser);

router.route("/login").post(userRegisterValidator(), validate, login);
export default router;
