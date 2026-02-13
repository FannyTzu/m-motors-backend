import "dotenv/config";
import "./instrument.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`M MOTORS Server is running on port ${PORT}`);
});
