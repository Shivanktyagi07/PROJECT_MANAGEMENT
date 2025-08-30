import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

// if there are any validation errors, it will return the errors in a specific format, otherwise it will call the next middleware.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = [];
    errors.array().forEach((err) =>
      extractedErrors.push({
        [err.path]: err.msg,
      })
    );
    console.log("Validation errors:", extractedErrors); // Add this line for debugging
    return next(new ApiError(422, "Validation Error", extractedErrors));
  }
};
export { validate };
