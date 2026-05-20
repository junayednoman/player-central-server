import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { uploadToS3, deleteFromS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TCreateNews, TUpdateNews } from "./news.validation";

const create = async (payload: TCreateNews, file: TFile) => {
  const imageUrl = await uploadToS3(file);

  return prisma.news.create({
    data: {
      ...payload,
      image: imageUrl,
    },
  });
};

const getAll = async (options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      skip,
      take,
      orderBy:
        sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
    }),
    prisma.news.count(),
  ]);

  return {
    meta: { page, limit: take, total },
    news,
  };
};

const getSingle = async (id: string) => {
  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) throw new ApiError(404, "News not found");
  return item;
};

const update = async (id: string, payload: TUpdateNews, file?: TFile) => {
  const existing = await prisma.news.findUnique({
    where: { id },
    select: { id: true, image: true },
  });
  if (!existing) throw new ApiError(404, "News not found");

  const data: Record<string, unknown> = { ...payload };

  if (file) {
    data.image = await uploadToS3(file);
    if (existing.image) {
      deleteFromS3(existing.image);
    }
  }

  return prisma.news.update({
    where: { id },
    data,
  });
};

const remove = async (id: string) => {
  const existing = await prisma.news.findUnique({
    where: { id },
    select: { id: true, image: true },
  });
  if (!existing) throw new ApiError(404, "News not found");

  if (existing.image) {
    deleteFromS3(existing.image);
  }

  await prisma.news.delete({ where: { id } });
  return existing;
};

export const newsServices = {
  create,
  getAll,
  getSingle,
  update,
  remove,
};
