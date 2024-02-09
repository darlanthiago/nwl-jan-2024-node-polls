import fastify from "fastify";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

import { createPoll } from "./routes/create-poll";
import { getPolls } from "./routes/get-polls";
import { getPoll } from "./routes/get-poll";
import { voteOnPollOption } from "./routes/vote-on-poll";
import { pollResult } from "./ws/poll-results";

const app = fastify();

app.register(cookie, {
  secret: "poll-app-nlw",
  hook: "onRequest",
});

app.register(websocket);

app.register(createPoll);
app.register(getPolls);
app.register(getPoll);
app.register(voteOnPollOption);
app.register(pollResult);

app.listen({ port: 3333 }).then(() => {
  console.log("Server is running on port 3333");
});
