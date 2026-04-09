import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { invitationServices } from "./invitation.service";

const send = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await invitationServices.send(req.user?.id as string, req.body);
  sendResponse(res, {
    message: "Invitation sent successfully!",
    data: result,
  });
});

const getSent = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await invitationServices.getSent(
    req.user?.id as string,
    options
  );
  sendResponse(res, {
    message: "Sent invitations retrieved successfully!",
    data: result,
  });
});

const getReceived = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await invitationServices.getReceived(
    req.user?.id as string,
    options
  );
  sendResponse(res, {
    message: "Received invitations retrieved successfully!",
    data: result,
  });
});

export const invitationController = {
  send,
  getSent,
  getReceived,
};
