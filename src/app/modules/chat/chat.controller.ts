import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { chatServices } from "./chat.service";
import { getIO } from "../../socket";

const createConversation = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await chatServices.getOrCreateConversation(
      req.user?.id as string,
      req.body
    );

    sendResponse(res, {
      message: "Conversation ready successfully!",
      data: result,
    });
  }
);

const listConversations = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const options = pick(req.query, ["page", "limit"]);
    const result = await chatServices.listConversations(
      req.user?.id as string,
      options,
      req.query.searchTerm as string | undefined
    );

    sendResponse(res, {
      message: "Conversations retrieved successfully!",
      data: result,
    });
  }
);

const getMessages = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await chatServices.getMessages(
    req.params.conversationId as string,
    req.user?.id as string,
    options
  );

  sendResponse(res, {
    message: "Messages retrieved successfully!",
    data: result,
  });
});

const sendMessage = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const result = await chatServices.sendMessage(
    conversationId,
    req.user?.id as string,
    req.body
  );

  getIO().to(`conversation:${conversationId}`).emit("chat:message:new", result);

  sendResponse(res, {
    message: "Message sent successfully!",
    data: result,
  });
});

const markConversationRead = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const conversationId = req.params.conversationId as string;
    const result = await chatServices.markConversationRead(
      conversationId,
      req.user?.id as string
    );

    getIO().to(`conversation:${conversationId}`).emit("chat:read", {
      conversationId,
      authId: req.user?.id,
    });

    sendResponse(res, {
      message: "Conversation marked as read successfully!",
      data: result,
    });
  }
);

export const chatController = {
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
};
