require('dotenv').config();
const express = require('express');
const app = express();

const ApiError = require('./src/utils/ApiError');
const httpStatus = require('http-status');
const cors = require('cors');
const { authRoute, invoiceRoute, utilsRoute, entityRoute, webHookRoute } = require('./src/routes');
const { errorConverter, errorHandler } = require('./src/middleware/error');
const fileUpload = require("express-fileupload");
const dbConnect = require('./src/config/db.config');

const corsOptions = {
  origin: '*', // Update this for production
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/'
}));

// Middleware
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api/v1', authRoute);
app.use('/api/v1', invoiceRoute);
app.use('/api/v1', utilsRoute);
app.use('/api/v1', entityRoute);
app.use('/api/v1', webHookRoute);

// Catch-all for 404 errors
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found', true));
});

// Error handling middleware
app.use(errorConverter);
app.use(errorHandler);

// Start the server after connecting to the database
const startServer = async () => {
  try {
    dbConnect;
    console.log('Database connected successfully');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;