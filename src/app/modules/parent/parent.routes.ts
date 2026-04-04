import { Router } from "express";
import { parentController } from "./parent.controller";

const router = Router();

router.get("/search", parentController.searchParents);

export const parentRoutes = router;
