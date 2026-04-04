import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { parentServices } from "./parent.service";

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

export const parentController = {
  searchParents,
};
