import { JsonWebTokenError } from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.handler.js";
import jwt from "jsonwebtoken";

/**
 *  verifyJWT Middleware
 *
 * ✅ Why we use this?
 * - To protect private routes (e.g., dashboard, profile, project management).
 * - Ensures only authenticated users with a valid JWT can access these routes.
 *
 * ✅ Need of this middleware
 * - Without verification, anyone could access secure APIs.
 * - JWT (JSON Web Token) helps us securely transmit user identity between frontend and backend.
 * - This middleware automatically verifies if the incoming request has a valid token before allowing it to proceed.
 *
 * ✅ How it's working step by step:
 * 1. Extracts the token from either cookies (req.cookie.accessToken)
 *    or from the request headers (Authorization: Bearer <token>).
 * 2. If no token is found → throw Unauthorized (401) error.
 * 3. If token is present → verify it using jwt.verify() and secret key.
 * 4. If verification is successful → extract the user ID (_id) from token payload.
 * 5. Fetch the corresponding user from DB, but exclude sensitive fields (password, tokens, etc.).
 * 6. If user exists → attach user object to req.user and call next() to proceed.
 * 7. If token invalid or user not found → throw Unauthorized (401).
 */

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Get token either from cookies or Authorization header
  const token =
    req.cookies?.accessToken || // check cookies (fixed req.cookie → req.cookies)
    req.header("Authorization")?.replace("Bearer ", ""); // check header, remove "Bearer " prefix

  // If no token, block request
  if (!token) {
    throw new ApiError(401, "Unauthorized Request!");
  }

  try {
    // Verify token using secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user by decoded ID, exclude sensitive fields
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    );

    // If no user found with that ID
    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }

    // Attach user data to request for next middleware/controller
    req.user = user;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Token invalid/expired
    throw new ApiError(401, "Invalid Access Token!");
  }
});
