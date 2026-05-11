import { TRequest } from "../../interface/global.interface";
import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import pick from "../../utils/pick";
import { reviewService } from "./review.service";

const createReview = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await reviewService.createReview(
      req.body,
      req.user?.id as string
    );
    sendResponse(res, {
      message: "Review created successfully!",
      data: result,
      status: 201,
    });
  }
);

const getAllReviews = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
    const result = await reviewService.getAllReviews(options, req.query);
    sendResponse(res, {
      message: "Reviews retrieved successfully!",
      data: result,
    });
  }
);

const deleteReview = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await reviewService.deleteReview(
      req.params.id as string,
      req.user?.id as string
    );
    sendResponse(res, {
      message: "Review deleted successfully!",
      data: result,
    });
  }
);

export const reviewController = {
  createReview,
  getAllReviews,
  deleteReview,
};
