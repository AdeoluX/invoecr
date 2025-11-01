require("dotenv").config();
const express = require("express");
const app = express();

const ApiError = require("./src/utils/ApiError");
const httpStatus = require("http-status").default;
const cors = require("cors");
const {
  authRoute,
  invoiceRoute,
  utilsRoute,
  entityRoute,
  webHookRoute,
  subscriptionRoute,
  cardRoute,
  customerRoute,
} = require("./src/routes");
const { errorConverter, errorHandler } = require("./src/middleware/error");
const fileUpload = require("express-fileupload");
const dbConnect = require("./src/config/db.config");
const client = require("prom-client");
const basicAuth = require("express-basic-auth");

// Create registry and collect default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const corsOptions = {
  origin: "*", // Update this for production
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// sendMail();
// function sendMail() {
//   EmailUtils.sendEmail("juwontayo@gmail.com", "Test", "This is a test email");
// }

// Middleware
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  "/metrics",
  basicAuth({
    users: {
      [process.env.METRICS_USER || "admin"]:
        process.env.METRICS_PASS || "password",
    },
    challenge: true,
    realm: "Metrics",
  })
);

// Expose /metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route"],
  registers: [register],
});

app.get("/", (req, res) => {
  httpRequestsTotal.inc({ method: req.method, route: "/" });
  res.send("Hello World!");
});

// Handle common browser requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No content response
});

app.get("/robots.txt", (req, res) => {
  res.status(204).end(); // No content response
});

app.get("/sitemap.xml", (req, res) => {
  res.status(204).end(); // No content response
});

// Routes
app.use("/api/v1", authRoute);
app.use("/api/v1", invoiceRoute);
app.use("/api/v1", utilsRoute);
app.use("/api/v1", entityRoute);
app.use("/api/v1", webHookRoute);
app.use("/api/v1", subscriptionRoute);
app.use("/api/v1", cardRoute);
app.use("/api/v1", customerRoute);

// Catch-all for 404 errors
app.use((req, res, next) => {
  // Filter out common browser requests that aren't actual API errors
  const ignoredPaths = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];
  const isIgnoredPath = ignoredPaths.some((path) => req.originalUrl === path);

  if (!isIgnoredPath) {
    console.log(`Endpoint not found: ${req.method} ${req.originalUrl}`);
  }

  next(new ApiError(httpStatus.NOT_FOUND, "Not found", true));
});

// Error handling middleware
app.use(errorConverter);
app.use(errorHandler);

// Connect to database
const startServer = async () => {
  try {
    await dbConnect();
    console.log("Database connected successfully");

    // Initialize subscription renewal cron jobs
    try {
      const { subscriptionCronJobs } = require("./src/utils/subscription-cron");
      subscriptionCronJobs.init();
    } catch (cronError) {
      console.warn(
        "⚠️ Subscription cron jobs not initialized:",
        cronError.message
      );
      console.log("💡 Install node-cron: npm install node-cron");
    }
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
