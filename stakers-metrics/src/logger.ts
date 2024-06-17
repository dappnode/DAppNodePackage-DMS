import winston from "winston";

// Check if the DEBUG_MODE environment variable is set to "true"
const debugMode = process.env.DEBUG_MODE === "true";

// Create and configure the logger instance
const logger = winston.createLogger({
  level: debugMode ? "debug" : "info", // Set log level to "debug" if DEBUG_MODE is true, otherwise "info"
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log to the console
    // Add other transports here if you want to log to a file or other destinations
  ],
});

export default logger;
