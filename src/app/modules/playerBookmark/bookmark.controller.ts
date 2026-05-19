import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { PlayerBookmarkService } from "./bookmark.service";
import { Response } from "express";

const toggleBookmark = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await PlayerBookmarkService.toggleBookmark({
      coachAuthId: req.user?.id as string,
      playerAuthId: req.params.playerAuthId as string,
    });

    sendResponse(res, {
      success: true,
      message: result.message,
      data: result.data,
    });
  }
);

const getBookmarks = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await PlayerBookmarkService.getBookmarks(
      req.user?.id as string
    );

    sendResponse(res, {
      success: true,
      message: "Bookmarks retrieved successfully",
      data: result,
    });
  }
);

export const PlayerBookmarkController = {
  toggleBookmark,
  getBookmarks,
};
