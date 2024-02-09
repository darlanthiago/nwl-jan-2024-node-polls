import { FastifyInstance } from "fastify";
import z from "zod";
import { voting } from "../../utils/voting-pub-sub";

export async function pollResult(app: FastifyInstance) {
  app.get(
    "/polls/:pollId/results",
    { websocket: true },
    async (connection, req) => {
      const getPollParam = z.object({
        pollId: z.string().uuid(),
      });
      const { pollId } = getPollParam.parse(req.params);

      voting.subscribe(pollId, (message) => {
        connection.socket.send(JSON.stringify(message));
      });
    }
  );
}
