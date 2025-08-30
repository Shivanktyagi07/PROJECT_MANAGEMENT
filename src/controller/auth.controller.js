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
  const { email, password, username } = req.params; // assuming you’re sending via URL params

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

  const loggedInUSer = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry "
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
          user: loggedInUSer,
          accessToken,
          refreshToken,
        },
        "😎 Boom! You just hacked into your own account (legally)! 😂"
      )
    );
});

export { registerUser, login };
