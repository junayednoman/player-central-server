import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { playerServices } from "./player.service";
import pick from "../../utils/pick";
import { TRequest } from "../../interface/global.interface";

const getAll = handleAsyncRequest(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await playerServices.getAll(options, req.query);
  sendResponse(res, {
    message: "Players retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await playerServices.getSingle(req.params.id as string);
  sendResponse(res, {
    message: "Player retrieved successfully!",
    data: result,
  });
});

const getMyProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await playerServices.getMyProfile(req.user?.id as string);
    sendResponse(res, {
      message: "Profile retrieved successfully!",
      data: result,
    });
  }
);

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await playerServices.updateProfile(
      req.user?.id as string,
      req.body,
      req.file
    );
    sendResponse(res, {
      message: "Profile updated successfully!",
      data: result,
    });
  }
);

export const playerController = {
  getAll,
  getSingle,
  getMyProfile,
  updateProfile,
};
