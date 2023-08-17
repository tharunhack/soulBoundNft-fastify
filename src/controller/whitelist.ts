import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import dotenv from "dotenv";
import { checkAndInsertAddress } from "../whitelistValid";
dotenv.config();


function isValidAddressFormat(address: string): boolean {
  const addressPattern = /^0x[0-9a-fA-F]+$/;
  return addressPattern.test(address);
}


export default async function whitelist(fastify: FastifyInstance) {
  fastify.get(
    "/",
    async function (
      request: FastifyRequest<{ Querystring: { address: string } }>,
      reply: FastifyReply
    ) {
      const { address } = request.query;

      if (!address) {
        return reply.code(400).send({ error: "Missing address parameter" });
      }
      if (!isValidAddressFormat(address)) {
        return reply.code(400).send({error :"Invalid address format"});
      }
      if (address.length !== 42) {
        return reply.code(400).send({ error: "Invalid address the length should be in EVM address format" });
      }

      try {
        const result = await checkAndInsertAddress(address);

        if (result.exists) {
          if (result.isEligible) {
            reply
              .code(200)
              .send({
                message: "Address is already in the database and is eligible.",
              });
          } else {
            reply
              .code(400)
              .send({
                message:
                  "Address is already in the database but is not eligible.",
              });
          }
        } else {
          reply
            .code(200)
            .send({
              message: "Address is successfully added to the database.",
            });
        }
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          reply
            .code(400)
            .send({ message: "Address already exists in the database." });
        } else {
          reply.code(500).send({ message: "Internal server error." });
        }
      }
    }
  );
}
        




