import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance } from "fastify";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
  app.get("/poll/:pollId", async (req, reply) => {
    const getPollParam = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = getPollParam.parse(req.params);

    const poll = await prisma.poll.findFirst({
      relationLoadStrategy: "join",
      include: {
        options: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      where: {
        id: pollId,
      },
    });

    if (!poll) {
      return reply.status(404).send({
        message: "Poll not found",
      });
    }

    const result = await redis.zrange(pollId, 0, -1, "WITHSCORES");

    const votes = result.reduce((obj, line, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1];

        Object.assign(obj, { [line]: Number(score) });
      }

      return obj;
    }, {} as Record<string, number>);

    return reply.status(200).send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map((option) => {
          return {
            id: option.id,
            title: option.title,
            score: option.id in votes ? votes[option.id] : 0,
          };
        }),
      },
    });
  });
}
