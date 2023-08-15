import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();

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


export default async function whitelist(fastify: FastifyInstance) {
  fastify.get(
    "/",
    async function (
      request: FastifyRequest<{ Querystring: { address: any } }>,
      reply: FastifyReply
    ) {
      try {
        const { address } = request.query;

        if (!address) {
          reply.code(400).send({ error: "Missing address parameter" });
          return;
        }

        const query =
          "SELECT COUNT(*) AS count FROM soulboundnft WHERE address = ?";
        connection.query(query, [address], (error, results) => {
          if (error) {
            console.error("Database query error:", error);
            reply.code(500).send({ error: "Database query error" });
            return;
          }
          const count = results[0].count;
          console.log("count: ", count);
          
          if (count > 0) {
            console.log("count: ", count);
            console.log("true");
            reply.send({ data: true });
          } else {
            console.log("false");
            reply.send({ data: false });
          }
        });
      } catch (error) {
        console.error("Server error:", error);
        reply.code(500).send({ error: "Server error" });
      }
    }
  );
}
