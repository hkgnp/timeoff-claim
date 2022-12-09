require("dotenv").config();
const port = process.env.port || 8888;

const express = require("express");
const helmet = require("helmet");
const hbs = require("hbs");
const wax = require("wax-on");
const MongoUtil = require("./utils/MongoUtil");

const app = express();
app.use(helmet());
app.use(express.json());

app.use(express.static("public"));

app.set("view engine", "hbs");
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// routes
const dashboardRoute = require("./routes/dashboardRoute");
const activityRoute = require("./routes/activityRoute");
const claimRoute = require("./routes/claimRoute");

(async function () {
  const db = await MongoUtil.connect(process.env.MONGO_URL, "timeoff");

  // add mongodb to middleware
  app.use((req, res, next) => {
    req.mongoClient = db;
    next();
  });

  app.use("/dashboard", dashboardRoute);
  app.use("/activity", activityRoute);
  app.use("/claim", claimRoute);
})();

app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
