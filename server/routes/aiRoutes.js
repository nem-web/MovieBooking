import express from "express";
import { getAIRecommendations } from "../controllers/aiController.js";


const aiRouter = express.Router();

aiRouter.post("/recommend", getAIRecommendations);

export default aiRouter;