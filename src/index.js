const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const productRoutes = require("./routes/product");
const alertRoutes = require("./routes/alert");

const app = express();
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/stockflow", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.use("/api/products", productRoutes);
app.use("/api/companies", alertRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});