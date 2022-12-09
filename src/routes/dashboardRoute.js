const express = require("express");
const router = express.Router();

router.get("/", async function (req, res) {
  const employees = await req.mongoClient
    .collection("employees")
    .find({})
    .toArray();

  res.render("dashboard", {
    employees: employees,
  });
});

router.get("/:id", async function (req, res) {
  try {
    const details = await req.mongoClient
      .collection("employees")
      .findOne({ employeeId: req.params.id });

    res.render("details", {
      details: details,
      activities: details.activity,
      claims: details.claims,
    });
  } catch (e) {
    res.send(`Fatal error. Please contact the administrator.
Error message: ${e}`);
  }
});

module.exports = router;
