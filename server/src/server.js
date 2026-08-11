import dotenv from "dotenv";
import app from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

await connectDb();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
