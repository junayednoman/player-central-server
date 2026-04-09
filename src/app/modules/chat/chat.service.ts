import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import {
  TCreateConversation,
  TSendMessage,
} from "./chat.validation";

const ensureParticipant = async (conversationId: string, authId: string) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_authId: {
        conversationId,
        authId,
      },
    },
    select: { id: true },
  });

  if (!participant) {
    throw new ApiError(403, "Unauthorized");
  }
};

const getOrCreateConversation = async (
  authId: string,
  payload: TCreateConversation
) => {
  const participantId = payload.participantId;

  if (participantId === authId) {
    throw new ApiError(400, "You cannot start a conversation with yourself");
  }

  const otherUser = await prisma.auth.findUnique({
    where: { id: participantId },
    select: { id: true },
  });

  if (!otherUser) throw new ApiError(404, "User not found");

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      participants: {
        some: { authId },
      },
      AND: [
        {
          participants: {
            some: { authId: participantId },
          },
        },
        {
          participants: {
            every: {
              authId: { in: [authId, participantId] },
            },
          },
        },
      ],
    },
    include: {
      participants: {
        include: {
          auth: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (
    existingConversation &&
    existingConversation.participants.length === 2
  ) {
    return existingConversation;
  }

  return prisma.conversation.create({
    data: {
      participants: {
        create: [
          { authId, lastReadAt: new Date() },
          { authId: participantId },
        ],
      },
    },
    include: {
      participants: {
        include: {
          auth: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
};

const listConversations = async (
  authId: string,
  options: TPaginationOptions,
  searchTerm?: string
) => {
  const { page, take, skip } = calculatePagination(options);

  const participantWhere = searchTerm
    ? {
        auth: {
          profile: {
            name: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
        },
      }
    : {};

  const myParticipations = await prisma.conversationParticipant.findMany({
    where: {
      authId,
      conversation: {
        participants: {
          some: {
            authId: { not: authId },
            ...participantWhere,
          },
        },
      },
    },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              auth: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  profile: {
                    select: {
                      name: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: {
      conversation: {
        lastMessageAt: "desc",
      },
    },
    skip,
    take,
  });

  const total = await prisma.conversationParticipant.count({
    where: {
      authId,
      conversation: {
        participants: {
          some: {
            authId: { not: authId },
            ...participantWhere,
          },
        },
      },
    },
  });

  const conversations = await Promise.all(
    myParticipations.map(async participation => {
      const otherParticipant = participation.conversation.participants.find(
        item => item.authId !== authId
      );
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: participation.conversationId,
          senderAuthId: { not: authId },
          createdAt: participation.lastReadAt
            ? { gt: participation.lastReadAt }
            : undefined,
        },
      });

      return {
        id: participation.conversation.id,
        lastMessageAt: participation.conversation.lastMessageAt,
        unreadCount,
        participant: otherParticipant?.auth ?? null,
        lastMessage: participation.conversation.messages[0] ?? null,
      };
    })
  );

  return {
    meta: { page, limit: take, total },
    conversations,
  };
};

const getMessages = async (
  conversationId: string,
  authId: string,
  options: TPaginationOptions
) => {
  await ensureParticipant(conversationId, authId);

  const { page, take, skip } = calculatePagination(options);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    skip,
    take,
    include: {
      sender: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.message.count({
    where: { conversationId },
  });

  return {
    meta: { page, limit: take, total },
    messages,
  };
};

const sendMessage = async (
  conversationId: string,
  authId: string,
  payload: TSendMessage
) => {
  await ensureParticipant(conversationId, authId);

  return prisma.$transaction(async tx => {
    const message = await tx.message.create({
      data: {
        conversationId,
        senderAuthId: authId,
        text: payload.text,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    return message;
  });
};

const markConversationRead = async (conversationId: string, authId: string) => {
  await ensureParticipant(conversationId, authId);

  await prisma.conversationParticipant.update({
    where: {
      conversationId_authId: {
        conversationId,
        authId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  return { read: true };
};

const getConversationParticipantIds = async (conversationId: string) => {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { authId: true },
  });

  return participants.map(item => item.authId);
};

export const chatServices = {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  ensureParticipant,
  getConversationParticipantIds,
};
