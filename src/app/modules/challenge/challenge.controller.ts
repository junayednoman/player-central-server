import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { challengeServices } from "./challenge.service";
import { TRequest } from "../../interface/global.interface";
import ApiError from "../../classes/ApiError";
import pick from "../../utils/pick";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, "Video file is required");
  const result = await challengeServices.create(
    req.user?.id as string,
    req.body,
    req.file
  );
  sendResponse(res, {
    message: "Challenge created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await challengeServices.getAll(options);
  sendResponse(res, {
    message: "Challenges retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await challengeServices.getSingle(
    req.params.challengeId as string
  );
  sendResponse(res, {
    message: "Challenge retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await challengeServices.update(
    req.params.challengeId as string,
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Challenge updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await challengeServices.remove(
    req.params.challengeId as string,
    req.user?.id as string
  );
  sendResponse(res, {
    message: "Challenge deleted successfully!",
    data: result,
  });
});

const submit = handleAsyncRequest(async (req: TRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, "Video file is required");
  const result = await challengeServices.submit(
    req.params.challengeId as string,
    req.user?.id as string,
    req.body,
    req.file
  );
  sendResponse(res, {
    message: "Challenge submitted successfully!",
    data: result,
  });
});

const getCoachSubmissions = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
    const result = await challengeServices.getCoachSubmissions(
      req.user?.id as string,
      options
    );
    sendResponse(res, {
      message: "Challenge submissions retrieved successfully!",
      data: result,
    });
  }
);

export const challengeController = {
  create,
  getAll,
  getSingle,
  update,
  remove,
  submit,
  getCoachSubmissions,
};
