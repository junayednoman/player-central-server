import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { childService } from "./child.service";
import { Response } from "express";

const getAllChildren = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getAllChildren(req.query);

    sendResponse(res, {
      success: true,
      message: "Children retrieved successfully",
      data: result,
    });
  }
);

const getChildApprovalRequests = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getChildApprovalRequests(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Child approval requests retrieved successfully",
      data: result,
    });
  }
);

const updateChildStatus = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.updateChildStatus(
      req.params.id as string,
      req.user?.id as string,
      req.body.status
    );

    sendResponse(res, {
      success: true,
      message: "Child status updated successfully",
      data: result,
    });
  }
);

const getParentsByChildId = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getParentsByChildId(
      req.params.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Parents retrieved successfully",
      data: result,
    });
  }
);

export const childControllers = {
  getAllChildren,
  getChildApprovalRequests,
  updateChildStatus,
  getParentsByChildId,
};
