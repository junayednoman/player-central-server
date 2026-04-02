import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { sessionBookingServices } from "./sessionBooking.service";
import pick from "../../utils/pick";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await sessionBookingServices.create(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Session booking created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await sessionBookingServices.getAll(
    req.user?.id as string,
    req.user?.role as string,
    options
  );
  sendResponse(res, {
    message: "Session bookings retrieved successfully!",
    data: result,
  });
});

const getRecent = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await sessionBookingServices.getRecent(
    req.user?.id as string,
    req.user?.role as string
  );
  sendResponse(res, {
    message: "Recent session booking retrieved successfully!",
    data: result,
  });
});

export const sessionBookingController = {
  create,
  getAll,
  getRecent,
};
