import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { router } from "./routes/v1";
import errorHandler from "./utils/errorhandlling";
import logger from "./utils/logger";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get("/healthcheck", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', router);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
    logger.error(`Unhandled Rejection: ${error.message}`, error);
});
