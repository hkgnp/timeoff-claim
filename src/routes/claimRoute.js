const express = require("express");
const router = express.Router();
const formsg = require("@opengovsg/formsg-sdk")({ mode: "production" });

const POST_URI = process.env.CLAIM_URI;
const formSecretKey = process.env.CLAIM_SECRET;
const HAS_ATTACHMENTS = false;

router.post(
  "/",
  function (req, res, next) {
    try {
      formsg.webhooks.authenticate(req.get("X-FormSG-Signature"), POST_URI);
      return next();
    } catch (e) {
      return res.status(401).send({ message: "Unauthorised" });
    }
  },
  express.json(),
  async function (req, res) {
    let submission = HAS_ATTACHMENTS
      ? await formsg.crypto.decryptWithAttachments(formSecretKey, req.body.data)
      : formsg.crypto.decrypt(formSecretKey, req.body.data);

    if (submission) {
      submission = submission.responses;
      // Send to Mongo
      for (const i of submission) {
        delete i["_id"];
      }

      try {
        const employee = await req.mongoClient
          .collection("employees")
          .findOne({ employeeId: submission[0].answer });

        const newHours =
          parseFloat(employee.hoursToClaim) - parseFloat(submission[1].answer);

        await req.mongoClient.collection("employees").updateOne(
          { employeeId: submission[0].answer },
          {
            $set: {
              hoursToClaim: newHours,
            },
            $push: {
              claims: {
                date: new Date(),
                hours: submission[1].answer,
              },
            },
          },
          { upsert: true }
        );
        res.status(200);
      } catch (e) {
        console.log(e);
      }
    } else {
      res.status(404).send({ message: "Could not decrypt submission" });
    }
  }
);

module.exports = router;
