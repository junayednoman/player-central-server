import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { challengeApprovalRequestServices } from "./challengeApprovalRequest.service";

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await challengeApprovalRequestServices.getAll(
    req.user?.id as string,
    options
  );
  sendResponse(res, {
    message: "Challenge approval requests retrieved successfully!",
    data: result,
  });
});

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await challengeApprovalRequestServices.create(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Challenge approval request created successfully!",
    data: result,
  });
});

const updateStatus = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await challengeApprovalRequestServices.updateStatus(
    req.user?.id as string,
    req.params.requestId as string,
    req.body
  );
  sendResponse(res, {
    message: "Challenge approval request updated successfully!",
    data: result,
  });
});

export const challengeApprovalRequestController = {
  getAll,
  create,
  updateStatus,
};
