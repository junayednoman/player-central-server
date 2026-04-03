import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { customSessionServices } from "./customSession.service";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await customSessionServices.create(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Custom session created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await customSessionServices.getAll(
    req.user?.id as string,
    req.user?.role as string,
    options
  );
  sendResponse(res, {
    message: "Custom sessions retrieved successfully!",
    data: result,
  });
});

export const customSessionController = {
  create,
  getAll,
};
