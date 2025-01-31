#!/usr/bin/env node
import { createServer } from "http";
import { createNodeMiddleware, Webhooks } from "@octokit/webhooks";
import { createAppAuth } from "@octokit/auth-app";

import { router } from "./app/router.js";

const verbose = process.env.VERBOSE === "true";

const secret = process.env.WEBHOOK_SECRET;
const port = parseInt(process.env.PORT || "3000", 10);

const webhooks = new Webhooks({
  secret,
});

const auth = createAppAuth({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
});

webhooks.on("issue_comment.created", async ({ id, payload }) => {
  await router(auth, id, payload, verbose);
});

createServer(
  createNodeMiddleware(webhooks, {
    // Return 200 for health probes
    onUnhandledRequest: (request, res) => {
      res.setHeader("Content-Type", "text/plain");
      res.write("For webhooks POST to path /api/github/webhooks\n");
      res.end();
    },
  })
).listen(port, () => {
  console.log(`Listening for events on port ${port}`);
});
