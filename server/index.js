import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./src/db/index.js";

dotenv.config();

const PORT = process.env.PORT;
//database connection
connectDB()

app.listen(PORT, () => {
  console.log(`app is listen on port : ${PORT}`);
});
