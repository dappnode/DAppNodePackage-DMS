import express, { Request, Response } from "express";
import { register } from "./metrics.js";
import logger from "./logger.js"; // Import the logger from the separate file

const app = express();
const PORT = 9090;

app.listen(PORT, () => {
  logger.info(`Metrics server is running on port ${PORT}`);
});

app.get("/metrics", async (req: Request, res: Response) => {
  try {
    logger.info("Request recieved, preparing metrics")
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
    logger.info(`Metrics served`);
  } catch (error) {
    logger.error("Error collecting metrics:", error);
    res.status(500).end();
  }
});
