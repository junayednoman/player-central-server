import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import ApiError from "../../classes/ApiError";
import pick from "../../utils/pick";
import { TRequest } from "../../interface/global.interface";
import { postServices } from "./post.service";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, "Video file is required");
  const result = await postServices.create(
    req.user?.id as string,
    req.body,
    req.file
  );
  sendResponse(res, {
    message: "Post created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await postServices.getAll(options, req.user?.id);
  sendResponse(res, {
    message: "Posts retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await postServices.update(
    req.params.postId as string,
    req.user?.id as string,
    req.body,
    req.file
  );
  sendResponse(res, {
    message: "Post updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await postServices.remove(
    req.params.postId as string,
    req.user?.id as string
  );
  sendResponse(res, {
    message: "Post deleted successfully!",
    data: result,
  });
});

const share = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await postServices.incrementShare(
    req.params.postId as string,
    req.user?.id as string
  );
  sendResponse(res, {
    message: "Post share count updated successfully!",
    data: result,
  });
});

const addComment = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await postServices.addComment(
    req.params.postId as string,
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Comment added successfully!",
    data: result,
  });
});

const updateComment = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await postServices.updateComment(
      req.params.commentId as string,
      req.user?.id as string,
      req.body
    );
    sendResponse(res, {
      message: "Comment updated successfully!",
      data: result,
    });
  }
);

const removeComment = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await postServices.removeComment(
      req.params.commentId as string,
      req.user?.id as string
    );
    sendResponse(res, {
      message: "Comment deleted successfully!",
      data: result,
    });
  }
);

const toggleReaction = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await postServices.toggleReaction(
    req.params.postId as string,
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Reaction updated successfully!",
    data: result,
  });
});

export const postController = {
  create,
  getAll,
  update,
  remove,
  share,
  addComment,
  updateComment,
  removeComment,
  toggleReaction,
};
