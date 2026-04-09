import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { premiumPostServices } from "./premiumPost.service";

const getConfig = handleAsyncRequest(async (_req: Request, res: Response) => {
  const result = await premiumPostServices.getConfig();
  sendResponse(res, {
    message: "Premium post config retrieved successfully!",
    data: result,
  });
});

const upsertConfig = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await premiumPostServices.upsertConfig(req.body);
  sendResponse(res, {
    message: "Premium post config updated successfully!",
    data: result,
  });
});

export const premiumPostController = {
  getConfig,
  upsertConfig,
};
