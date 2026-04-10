import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { adminServices } from "./admin.service";
import { Response } from "express";
import {
  dashboardStatsQueryZod,
  earningStatsQueryZod,
} from "./admin.validation";

const getProfile = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await adminServices.getProfile(req.user?.id as string);
  sendResponse(res, {
    message: "Profile fetched successfully!",
    data: result,
  });
});

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await adminServices.updateProfile(
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

const getDashboardStats = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const { year } = dashboardStatsQueryZod.parse(req.query);
    const result = await adminServices.getDashboardStats(year);

    sendResponse(res, {
      message: "Dashboard stats fetched successfully!",
      data: result,
    });
  }
);

const getEarningStats = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const query = earningStatsQueryZod.parse(req.query);
    const result = await adminServices.getEarningStats(query);

    sendResponse(res, {
      message: "Earning stats fetched successfully!",
      data: result,
    });
  }
);

export const adminController = {
  getProfile,
  updateProfile,
  getDashboardStats,
  getEarningStats,
};
