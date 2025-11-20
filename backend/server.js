import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import gradesRouter from "./routes/grades.js";
import papersRouter from "./routes/papers.js";
import formsRouter from "./routes/forms.js";
import scraperRouter from "./routes/scraper.js";
import graphsRouter from "./routes/graphs.js";
import reviewRouter from "./routes/review.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/grades", gradesRouter);
app.use("/api/papers", papersRouter);
app.use("/api/forms", formsRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/graphs", graphsRouter);
app.use("/api/review", reviewRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BOE Portal API is running" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 BOE Portal API running on http://localhost:${PORT}`);
});
