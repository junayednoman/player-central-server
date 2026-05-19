import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { paymentServices } from "./payment.service";
import pick from "../../utils/pick";

const getCoachPayments = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : undefined;
    const result = await paymentServices.getCoachPayments(
      req.params.coachId as string,
      options,
      year,
      month
    );
    sendResponse(res, {
      message: "Coach payments retrieved successfully!",
      data: result,
    });
  }
);

const getCoachTotalEarnings = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : undefined;
    const result = await paymentServices.getCoachTotalEarnings(
      req.params.coachId as string,
      year,
      month
    );
    sendResponse(res, {
      message: "Coach total earnings retrieved successfully!",
      data: result,
    });
  }
);

const getCoachMonthlyEarnings = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const result = await paymentServices.getCoachMonthlyEarnings(
      req.params.coachId as string,
      year
    );
    sendResponse(res, {
      message: "Coach monthly earnings retrieved successfully!",
      data: result,
    });
  }
);

export const paymentController = {
  getCoachPayments,
  getCoachTotalEarnings,
  getCoachMonthlyEarnings,
};
