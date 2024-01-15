import express, { Express, Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

const index: Express = express();
const port = process.env.PORT;

index.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

index.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
