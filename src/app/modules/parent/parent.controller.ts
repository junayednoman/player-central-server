import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { parentServices } from "./parent.service";
import ApiError from "../../classes/ApiError";

const searchParents = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await parentServices.searchParents(
    req.query.email as string,
    options
  );
  sendResponse(res, {
    message: "Parents retrieved successfully!",
    data: result,
  });
});

const updateChildAccess = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    if (!req.params.childId) {
      throw new ApiError(400, "Child id is required");
    }

    const result = await parentServices.updateChildAccess(
      req.user!.id,
      req.params.childId,
      req.body
    );

    sendResponse(res, {
      message: "Child access settings updated successfully!",
      data: result,
    });
  }
);

export const parentController = {
  searchParents,
  updateChildAccess,
};
