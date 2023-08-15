import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { mintNft } from "../soulBound";
import * as mysql from "mysql";
import { ethers } from "ethers";
import { hashMessage } from "ethers/lib/utils";
import dotenv from "dotenv";
dotenv.config();

const test = async () => {
  const wallet = ethers.Wallet.createRandom();
  console.log("wallet: ", wallet);
  const message = "Hello World";
  const signature = await wallet.signMessage(message);
  console.log("Signature:", signature);
};
test();
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "soulbound",
};

const connection = mysql.createConnection(dbConfig);
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }

  console.log("Connected to the database.");
});

export default async function mint(fastify: FastifyInstance) {
  fastify.get(
    "/",
    async function (
      request: FastifyRequest<{ Querystring: { tokenURI: any } }>,
      reply: FastifyReply
    ) {
      const { tokenURI } = request.query;
      const signature = request.headers["signature"] as string;
      if (!signature) {
        reply.code(401).send({ message: "signature not available" });
        return;
      }
      const verifiedSigner = ethers.utils.recoverAddress(
        hashMessage(process.env.SIGN_MSG as string),
        signature
      );
      console.log("verifiedSigner", verifiedSigner);

      if (!verifiedSigner) {
        reply.code(401).send({ message: "Address not provided" });
        return;
      }

      const isValidSig = `SELECT \`address\` FROM soulboundnft WHERE \`address\` = ? AND \`iseligible\`= TRUE`;
      connection.query(isValidSig, [verifiedSigner], async (error, resolve) => {
        if (error) {
            console.log("error");
          reply.code(500).send({ message: "Internal Server Error" });
        } else {
          if (resolve.length === 0 || resolve[0].address !== verifiedSigner) {
            reply.code(401).send({ message: "Address not in DB" });
          }

          try {
            console.log("tryyyyyyyyyy");
            console.log(verifiedSigner);
            console.log(tokenURI);
            const mintHash = await mintNft(verifiedSigner, tokenURI);
            console.log("mintHash: ", mintHash);
            // Update isclaimed to true after minting
            const updateIsClaimedQuery = "UPDATE soulboundnft SET isclaimed = TRUE WHERE address = ?";
            connection.query(
              updateIsClaimedQuery,
              [verifiedSigner],
              (updateError) => {
                if (updateError) {
                  reply
                    .code(500)
                    .send({ message: "Failed to update isclaimed status" });
                } else {
                  reply.send({ mintHash });
                }
              }
            );
          } catch (error) {
            console.log(error);
            reply.send({
              Error: error,
            });
          }
        }
      });
    }
  );
}

