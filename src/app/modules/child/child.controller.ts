import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { childService } from "./child.service";
import { Response } from "express";

const getAllChildren = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getAllChildren(
      req.query,
      req.user?.id as string
    );

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

const updateDefaultChildId = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.updateDefaultChildId(
      req.params.id as string,
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Default child update successfully",
      data: result,
    });
  }
);

const addNewParent = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.addNewParent(
      req.body,
      req.params?.id as string,
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "New parent added successfully",
      data: result,
    });
  }
);

const addChildRequest = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.addChildRequest(
      req.params.childId as string,
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Add child request sent successfully",
      data: result,
    });
  }
);

const getChildAddRequests = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getChildAddRequests(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Add child requests retrieved successfully",
      data: result,
    });
  }
);

const updateChildAddRequest = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.updateChildAddRequest(
      req.params?.addChildRequestId as string,
      req.body.status
    );

    sendResponse(res, {
      success: true,
      message: "Add child requests updated successfully",
      data: result,
    });
  }
);

const getAllAvailableChild = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getAllAvailableChild(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Available children retrieved successfully",
      data: result,
    });
  }
);

const getChildSignUpRequests = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getChildSignUpRequests(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Child sign up requests retrieved successfully",
      data: result,
    });
  }
);

const getAllReceivedAddNewParentRequests = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.getAllReceivedAddNewParentRequests(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Add new parent requests retrieved successfully",
      data: result,
    });
  }
);

const updateAddNewParentRequest = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await childService.updateAddNewParentRequest(
      req.params?.requestId as string,
      req.body.status
    );

    sendResponse(res, {
      success: true,
      message: "Add new parent request updated successfully",
      data: result,
    });
  }
);

export const childControllers = {
  getAllChildren,
  getChildApprovalRequests,
  updateChildStatus,
  getParentsByChildId,
  updateDefaultChildId,
  getAllReceivedAddNewParentRequests,
  addNewParent,
  updateAddNewParentRequest,
  addChildRequest,
  getChildAddRequests,
  updateChildAddRequest,
  getAllAvailableChild,
  getChildSignUpRequests,
};
