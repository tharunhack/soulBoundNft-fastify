import { FastifyInstance } from "fastify";
import whitelist from "./controller/whitelist";
import mint from "./controller/mint";

export default async function router(fastify: FastifyInstance) {
  fastify.register(mint, { prefix: "/mint"});
  fastify.register(whitelist, { prefix: "/whitelist"});
}
