import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import ApiError from "../../classes/ApiError";
import { TRequest } from "../../interface/global.interface";
import { newsServices } from "./news.service";
import pick from "../../utils/pick";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, "Image is required");
  const result = await newsServices.create(req.body, req.file);
  sendResponse(res, {
    message: "News created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await newsServices.getAll(options);
  sendResponse(res, {
    message: "News retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (_req: TRequest, res: Response) => {
  const result = await newsServices.getSingle(_req.params.id as string);
  sendResponse(res, {
    message: "News retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await newsServices.update(
    req.params.id as string,
    req.body,
    req.file
  );
  sendResponse(res, {
    message: "News updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (_req: TRequest, res: Response) => {
  const result = await newsServices.remove(_req.params.id as string);
  sendResponse(res, {
    message: "News deleted successfully!",
    data: result,
  });
});

export const newsController = {
  create,
  getAll,
  getSingle,
  update,
  remove,
};
