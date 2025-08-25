import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.handler.js";
import { sendEmail } from "../utils/mail.js";
import { emailVerificationTemplate } from "../utils/mail.js";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating AccessToken"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Create a new user
  const user = new User({
    username,
    email,
    password,
    isEmailVerified: false,
    // role: role || "user", // Default role is 'user' if not provided
  });

  // generate email verification token before saving the user:
  const { unHashedToken, hashedToken, tokenExpiryTime } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiryTime = tokenExpiryTime;

  //we use validateBeforeSave = false to skip validation for other fields which are not required at the moment like fullName and etc.
  await user.save({ validateBeforeSave: false });

  // Send verification email:
  await sendEmail({
    email: user?.email,
    subject: "Verify Your Email",
    mailGenContent: emailVerificationTemplate(
      user?.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token/${unHashedToken}`
    ),
  });

  //why we do this? becuase we don't want to send sensitive data like password, refreshToken, emailVerificationToken and etc. in the response.
  const createUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry "
  );

  if (!createUser) {
    throw new ApiError(500, "Something went wrong while creating the user ");
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createUser },
        "User registered successfully and verification email has been sent on your email"
      )
    );
});

export { registerUser };
