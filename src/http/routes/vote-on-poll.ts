import { FastifyInstance } from "fastify";
import z from "zod";
import { randomUUID } from "node:crypto";

import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { voting } from "../../utils/voting-pub-sub";

export async function voteOnPollOption(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (req, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const getPollParam = z.object({
      pollId: z.string().uuid(),
    });

    const { pollOptionId } = voteOnPollBody.parse(req.body);
    const { pollId } = getPollParam.parse(req.params);

    let { sessionId } = req.cookies;

    if (sessionId) {
      const userPrevieusVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (
        userPrevieusVoteOnPoll &&
        userPrevieusVoteOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPrevieusVoteOnPoll.id,
          },
        });

        const votes = await redis.zincrby(
          pollId,
          -1,
          userPrevieusVoteOnPoll.pollOptionId
        );

        voting.publish(pollId, {
          pollOptionId: userPrevieusVoteOnPoll.pollOptionId,
          votes: Number(votes),
        });
      } else if (userPrevieusVoteOnPoll) {
        return reply.status(400).send({
          message: "You already voted on this poll",
        });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    });

    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes),
    });

    return reply.status(201).send({ message: "Vote computed with success" });
  });
}
