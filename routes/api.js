import express from "express";
const router = express.Router();
import getData from "../controllers/dataController.js";

router.get("/data", getData);

export default router;
