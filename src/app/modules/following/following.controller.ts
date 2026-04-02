import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { followingServices } from "./following.service";
import pick from "../../utils/pick";

const toggle = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await followingServices.toggle(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Following status updated successfully!",
    data: result,
  });
});

const getFollowing = handleAsyncRequest(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await followingServices.getFollowing(
    req.params.userId as string,
    options
  );
  sendResponse(res, {
    message: "Following retrieved successfully!",
    data: result,
  });
});

const getFollowers = handleAsyncRequest(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await followingServices.getFollowers(
    req.params.userId as string,
    options
  );
  sendResponse(res, {
    message: "Followers retrieved successfully!",
    data: result,
  });
});

export const followingController = {
  toggle,
  getFollowing,
  getFollowers,
};
