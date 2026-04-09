import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt, { Secret } from "jsonwebtoken";
import config from "./config";
import { TAuthUser } from "./interface/global.interface";
import { chatServices } from "./modules/chat/chat.service";

let io: SocketIOServer;

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token as string | undefined;
  if (authToken) {
    return authToken.startsWith("Bearer ")
      ? authToken.slice(7)
      : authToken;
  }

  const headerToken = socket.handshake.headers.authorization;
  if (typeof headerToken === "string" && headerToken.startsWith("Bearer ")) {
    return headerToken.slice(7);
  }

  return undefined;
};

const getSocketUser = (socket: Socket) => socket.data.user as TAuthUser;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://72.244.153.29:3000"],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decodedUser = jwt.verify(
        token,
        config.jwt.accessSecret as Secret
      ) as TAuthUser;

      socket.data.user = decodedUser;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", socket => {
    const user = getSocketUser(socket);
    socket.join(`user:${user.id}`);

    socket.on("chat:join", async (payload: { conversationId: string }) => {
      try {
        await chatServices.ensureParticipant(payload.conversationId, user.id);
        socket.join(`conversation:${payload.conversationId}`);
      } catch (_error) {
        socket.emit("chat:error", {
          message: "Unable to join conversation",
        });
      }
    });

    socket.on(
      "chat:send-message",
      async (payload: { conversationId: string; text: string }) => {
        try {
          const message = await chatServices.sendMessage(
            payload.conversationId,
            user.id,
            { text: payload.text }
          );

          io.to(`conversation:${payload.conversationId}`).emit(
            "chat:message:new",
            message
          );

          const participantIds = await chatServices.getConversationParticipantIds(
            payload.conversationId
          );

          participantIds.forEach(participantId => {
            io.to(`user:${participantId}`).emit("chat:conversation:update", {
              conversationId: payload.conversationId,
              message,
            });
          });
        } catch (_error) {
          socket.emit("chat:error", {
            message: "Unable to send message",
          });
        }
      }
    );

    socket.on(
      "chat:typing:start",
      async (payload: { conversationId: string }) => {
        try {
          await chatServices.ensureParticipant(payload.conversationId, user.id);
          socket.to(`conversation:${payload.conversationId}`).emit(
            "chat:typing:start",
            {
              conversationId: payload.conversationId,
              authId: user.id,
            }
          );
        } catch (_error) {
          socket.emit("chat:error", {
            message: "Unable to update typing status",
          });
        }
      }
    );

    socket.on(
      "chat:typing:stop",
      async (payload: { conversationId: string }) => {
        try {
          await chatServices.ensureParticipant(payload.conversationId, user.id);
          socket.to(`conversation:${payload.conversationId}`).emit(
            "chat:typing:stop",
            {
              conversationId: payload.conversationId,
              authId: user.id,
            }
          );
        } catch (_error) {
          socket.emit("chat:error", {
            message: "Unable to update typing status",
          });
        }
      }
    );

    socket.on("chat:mark-read", async (payload: { conversationId: string }) => {
      try {
        await chatServices.markConversationRead(payload.conversationId, user.id);
        io.to(`conversation:${payload.conversationId}`).emit("chat:read", {
          conversationId: payload.conversationId,
          authId: user.id,
        });
      } catch (_error) {
        socket.emit("chat:error", {
          message: "Unable to mark conversation as read",
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};
