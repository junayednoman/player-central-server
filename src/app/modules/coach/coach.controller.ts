import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { coachServices } from "./coach.service";
import pick from "../../utils/pick";
import { TRequest } from "../../interface/global.interface";

const getAll = handleAsyncRequest(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await coachServices.getAll(options, req.query);
  sendResponse(res, {
    message: "Coaches retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await coachServices.getSingle(req.params.id as string);
  sendResponse(res, {
    message: "Coach retrieved successfully!",
    data: result,
  });
});

const getMyProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await coachServices.getMyProfile(req.user?.id as string);
    sendResponse(res, {
      message: "Profile retrieved successfully!",
      data: result,
    });
  }
);

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await coachServices.updateProfile(
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

const addAvailability = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await coachServices.addAvailability(
      req.user?.id as string,
      req.body
    );
    sendResponse(res, {
      message: "Availability added successfully!",
      data: result,
    });
  }
);

const removeAvailability = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await coachServices.removeAvailability(
      req.user?.id as string,
      req.params.availabilityId as string
    );
    sendResponse(res, {
      message: "Availability removed successfully!",
      data: result,
    });
  }
);

const getAvailabilityCalendar = handleAsyncRequest(
  async (req: Request, res: Response) => {
    const month = req.query.month as string;
    const result = await coachServices.getAvailabilityCalendar(
      req.params.coachId as string,
      month
    );
    sendResponse(res, {
      message: "Availability calendar retrieved successfully!",
      data: result,
    });
  }
);

const getAvailabilitySlots = handleAsyncRequest(
  async (req: Request, res: Response) => {
    const date = req.query.date as string;
    const result = await coachServices.getAvailabilitySlots(
      req.params.coachId as string,
      date
    );
    sendResponse(res, {
      message: "Availability slots retrieved successfully!",
      data: result,
    });
  }
);

export const coachController = {
  getAll,
  getSingle,
  getMyProfile,
  updateProfile,
  addAvailability,
  removeAvailability,
  getAvailabilityCalendar,
  getAvailabilitySlots,
};
