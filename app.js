require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");

const app = express();

// Routes
const indexRouter = require("./routes/indexRouter");
const bookRouter = require("./routes/bookRoutes");
const genreRouter = require("./routes/genreRoutes");

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/books", bookRouter);
app.use("/genres", genreRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
