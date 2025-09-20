require("dotenv").config();
const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// Routers
const categoryRouter = require("./routes/categoryRoutes");
const itemRouter = require("./routes/itemRoutes");
const homeController = require("./controllers/homeController");

const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", homeController.index);
app.use("/categories", categoryRouter);
app.use("/items", itemRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
