import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { bookingApprovalRequestServices } from "./bookingApprovalRequest.service";

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await bookingApprovalRequestServices.getAll(
    req.user?.id as string,
    options
  );
  sendResponse(res, {
    message: "Booking approval requests retrieved successfully!",
    data: result,
  });
});

const updateStatus = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await bookingApprovalRequestServices.updateStatus(
    req.user?.id as string,
    req.params.requestId as string,
    req.body
  );
  sendResponse(res, {
    message: "Booking approval request updated successfully!",
    data: result,
  });
});

const createPaymentIntent = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await bookingApprovalRequestServices.createPaymentIntent(
      req.user?.id as string,
      req.params.requestId as string
    );
    sendResponse(res, {
      message: "Payment intent created successfully!",
      data: result,
    });
  }
);

export const bookingApprovalRequestController = {
  getAll,
  createPaymentIntent,
  updateStatus,
};
