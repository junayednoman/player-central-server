import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { supportServices } from "./support.service";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await supportServices.create(req.user?.id as string, req.body);
  sendResponse(res, {
    message: "Support message sent successfully!",
    data: result,
  });
});

export const supportController = {
  create,
};
