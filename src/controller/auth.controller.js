import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.handler.js";
import { sendEmail, emailVerificationTemplate } from "../utils/mail.js";

// ---------------------------
// Helper Function: Generate Access & Refresh Tokens
// ---------------------------
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error.message);
    throw new ApiError(
      500,
      "Something went wrong while generating AccessToken"
    );
  }
};

// ---------------------------
// Funny Messages for Invalid Password
// ---------------------------
const funnyInvalidPassword = [
  "❌ Wrong password! Even Dora couldn't explore that 🗺️",
  "🔑 Password denied! Not even Gandalf would let you pass ⚔️",
  "😂 That password is so wrong, even my calculator laughed at it 📟",
  "🚫 Incorrect password… maybe try 'password123'? (just kidding 😜)",
  "🕵️ Password invalid! Did you mash your keyboard in rage? 🤔",
  "🔥 Wrong password detected… setting your keyboard on fire in 3…2…1… 💥",
  "🤖 Invalid password! My AI brain says you typed gibberish 🤯",
  "📉 Password attempt failed… confidence level: -100% 😅",
];

// ---------------------------
// Register User Controller
// ---------------------------
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
    // role: role || "user",
  });

  // Generate email verification token
  const { unHashedToken, hashedToken, tokenExpiryTime } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiryTime = tokenExpiryTime;

  await user.save({ validateBeforeSave: false });

  // Send verification email
  await sendEmail({
    email: user?.email,
    subject: "Verify Your Email",
    mailGenContent: emailVerificationTemplate(
      user?.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token/${unHashedToken}`
    ),
  });

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry "
  );

  if (!createUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
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

// ---------------------------
// Login Controller
// ---------------------------
const login = asyncHandler(async (req, res) => {
  // ✅ Get credentials from body, not params
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(
      400,
      "💔 That email is invalid… just like my ex's promises 😭"
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(
      404,
      "📂 User missing… checked under the bed and in the fridge too 🧃"
    );
  }

  // Check password validity
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const randomMessage =
      funnyInvalidPassword[
        Math.floor(Math.random() * funnyInvalidPassword.length)
      ];
    throw new ApiError(400, randomMessage);
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "😎 Boom! You just hacked into your own account (legally)! 😂"
      )
    );
});

// ---------------------------
// Logout Controller
// ---------------------------
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiError(200, {}, "Signing off human😎!"));
});

// ---------------------------
// Read User By ID
// ---------------------------

const getUserById = asyncHandler(async (req, res) => {
  const { Id } = req.params;
  const user = await User.findById(Id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully!😎"));
});

// ---------------------------
// update User
// ---------------------------

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { username, email, role } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User updated successfully"));
});

// ---------------------------
// get ALl User
// ---------------------------

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, { users }, "All users fetched successfully"));
});

// ---------------------------
// Delete  User
// ---------------------------

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User Deleted Successfully"));
});

export {
  registerUser,
  login,
  logoutUser,
  getUserById,
  updateUser,
  getAllUsers,
  deleteUser,
};
