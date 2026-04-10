import { Response } from "express";
import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { reportServices } from "./report.service";
import { getReportsQueryZod, removeReportedContentZod } from "./report.validation";

type TReportContentType = "COMMUNITY_POST" | "PREMIUM_POST" | "CHALLENGE";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await reportServices.create(req.user!.id, req.body);

  sendResponse(res, {
    status: 201,
    message: "Content reported successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit"]);
  const { type } = getReportsQueryZod.parse(req.query);
  const result = await reportServices.getAll(options, {
    type: type as TReportContentType | undefined,
  });

  sendResponse(res, {
    message: "Reported content retrieved successfully!",
    data: result,
  });
});

const removeContent = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const { type } = removeReportedContentZod.parse(req.query);
    const result = await reportServices.removeContent(
      req.params.contentId as string,
      type
    );

    sendResponse(res, {
      message: "Reported content removed successfully!",
      data: result,
    });
  }
);

export const reportController = {
  create,
  getAll,
  removeContent,
};
