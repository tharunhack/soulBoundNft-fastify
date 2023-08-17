import * as mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();


const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "chibiki_db",
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to database");
  }
});

export function queryPromise(query: string, values?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

export async function checkAndInsertAddress(address: string) {
 try {
   const selectQuery =
     "SELECT eoa_address, is_eligible FROM nft WHERE eoa_address = ?";
   const selectResult: any[] = await queryPromise(selectQuery, [address]);

   if (selectResult.length > 0) {
     return { exists: true, isEligible: selectResult[0].is_eligible === 1 };
   } else {
     const insertQuery =
       "INSERT INTO nft (eoa_address, is_eligible) VALUES (?, true)";
     await queryPromise(insertQuery, [address]);
     return { exists: false, isEligible: true };
   }
 } catch (error: any) {
   console.error("Error:", error);
   if (error.code === "ER_DUP_ENTRY") {
     throw new Error("Address already exists in the database");
   }
   throw error;
 }
}
