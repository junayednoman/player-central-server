import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { chatController } from "./chat.controller";
import {
  createConversationZod,
  markConversationReadZod,
  sendMessageZod,
} from "./chat.validation";

const router = Router();

router.post(
  "/conversations",
  authorize(),
  validate(createConversationZod),
  chatController.createConversation
);

router.get("/conversations", authorize(), chatController.listConversations);

router.get(
  "/conversations/:conversationId/messages",
  authorize(),
  chatController.getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authorize(),
  validate(sendMessageZod),
  chatController.sendMessage
);

router.patch(
  "/conversations/:conversationId/read",
  authorize(),
  validate(markConversationReadZod),
  chatController.markConversationRead
);

export const chatRoutes = router;
