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
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "chibiki_db",
});
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
      const isValidSig = `SELECT eoa_address, is_eligible, is_claimed FROM nft WHERE eoa_address = ?`;
      connection.query(isValidSig, [verifiedSigner], (error, results) => {
        if (error) {
          console.log("error: ", error);
          reply.code(500).send({ message: "Internal Server Error" });
        } else {
          if (results.length === 0 || results[0].eoa_address !== verifiedSigner ) {
            reply
              .code(401)
              .send({ message: "Address not eligible or not in DB" });
              return;
          } else {
            const { is_eligible, is_claimed } = results[0];
            switch (true) {
              case (is_eligible === 0 && is_claimed === 0):
                reply
                  .code(401)
                  .send({
                    message: "Address is not eligible, and not claimed",
                  });
                break;
              case (is_eligible === 0 && is_claimed === 1):
                reply.code(401).send({ message: "Address is already claimed"})
                break;
            }
          }
        }
      });
      try {
        const mintHash = await mintNft(verifiedSigner, tokenURI);
        reply.send({ mintHash });
        // Update isclaimed to true after minting
        const updateIsClaimedQuery = `UPDATE nft SET is_claimed = 1 WHERE eoa_address = ?`;
        connection.query(
          updateIsClaimedQuery,
          [verifiedSigner],
          (updateError) => {
            if (updateError) {
              reply
                .code(500)
                .send({ message: "Failed to update isclaimed status" });
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
  );
}
