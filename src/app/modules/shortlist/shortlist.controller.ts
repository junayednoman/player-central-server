import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { shortlistServices } from "./shortlist.service";

const toggle = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await shortlistServices.toggle(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Shortlist updated successfully!",
    data: result,
  });
});

const getMyShortlistedPlayers = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
    const result = await shortlistServices.getShortlistedPlayers(
      req.user?.id as string,
      options
    );
    sendResponse(res, {
      message: "Shortlisted players retrieved successfully!",
      data: result,
    });
  }
);

export const shortlistController = {
  toggle,
  getMyShortlistedPlayers,
};
