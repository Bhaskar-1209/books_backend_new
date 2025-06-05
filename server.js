require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4040;

// Routes
const bookRoutes = require("./routes/bookRoutes");
const authRoutes = require("./routes/authRoutes"); // If needed

// Middleware
app.use(cors());
app.use(express.json());

// Static File Serving
app.use("/uploads/books", express.static(path.join(__dirname, "uploads/books")));
app.use("/uploads/covers", express.static(path.join(__dirname, "uploads/covers")));
app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles")));


// Route Mounting
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
