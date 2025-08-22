import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.handler.js";
// Controller for health check endpoint
// const healthCheck = async (req, res, next) => {
//   try {
//     const user = await getUserFromDB();
//     res
//       .status(2000)
//       .json(new ApiResponse(200, { message: "Server is healthy" }));
//   } catch (error) {
//     next(err);
//   }
// };

const healthCheck = asyncHandler(async (req, res, next) => {
  res.status(2000).json(new ApiResponse(200, { message: "Server is healthy" }));
});

export { healthCheck };
