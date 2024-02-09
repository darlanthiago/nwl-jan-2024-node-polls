import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance } from "fastify";

export async function getPolls(app: FastifyInstance) {
  app.get("/poll", async (req, reply) => {
    const listPollsPaginate = z.object({
      page: z.preprocess(Number, z.number()),
      limit: z.preprocess(Number, z.number()),
    });

    const { page, limit } = listPollsPaginate.parse(req.query);

    const skip = (page - 1) * limit;

    const polls = await prisma.poll.findMany({
      relationLoadStrategy: "join",
      include: {
        options: true,
      },
      skip,
      take: limit,
    });

    const result = {
      per_page: limit,
      count: polls.length,
      current_page: page,
      data: polls,
    };

    return reply.status(200).send(result);
  });
}
