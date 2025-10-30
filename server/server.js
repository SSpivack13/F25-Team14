import app from './app.js';
import dotenv from "dotenv";
dotenv.config();

const port = 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
