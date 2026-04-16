import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { scoutServices } from "./scout.service";

const getMyProfile = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await scoutServices.getMyProfile(req.user!.id);
  sendResponse(res, {
    message: "Profile retrieved successfully!",
    data: result,
  });
});

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await scoutServices.updateProfile(
      req.user!.id,
      req.body,
      req.file
    );

    sendResponse(res, {
      message: "Profile updated successfully!",
      data: result,
    });
  }
);

export const scoutController = {
  getMyProfile,
  updateProfile,
};
