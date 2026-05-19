import prisma from "../../utils/prisma";

const toggleBookmark = async ({
  coachAuthId,
  playerAuthId,
}: {
  coachAuthId: string;
  playerAuthId: string;
}) => {
  const existingBookmark = await prisma.playerBookmark.findFirst({
    where: {
      coachAuthId,
      playerAuthId,
    },
  });

  if (existingBookmark) {
    await prisma.playerBookmark.delete({
      where: {
        id: existingBookmark.id,
      },
    });

    return {
      message: "Bookmark removed",
      data: null,
    };
  }

  const bookmark = await prisma.playerBookmark.create({
    data: {
      coachAuthId,
      playerAuthId,
    },
  });

  return {
    message: "Bookmark added",
    data: bookmark,
  };
};

const getBookmarks = async (coachAuthId: string) => {
  const bookmarks = await prisma.playerBookmark.findMany({
    where: {
      coachAuthId,
    },
    include: {
      player: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return bookmarks;
};

export const PlayerBookmarkService = {
  toggleBookmark,
  getBookmarks,
};
