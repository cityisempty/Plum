import { createApp } from "./app.js";
import { config } from "./lib/config.js";
import { getDb } from "./db/client.js";

getDb();
const app = createApp();
app.listen(config.port, () => {
  console.log(`plum server http://localhost:${config.port}`);
});
