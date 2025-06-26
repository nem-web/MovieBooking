import express from "express";
import { retryPayment } from "../controllers/retryPayment.js";

const router = express.Router();

router.post("/retry", retryPayment);

export default router;
