import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { config } from "./config/config.js";

// CONNECT TO DATABASE
connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`\n✅ Server running at: http://localhost:${config.port}\n`);
    });
  })
  .catch(() => {
    console.error("\n❌ Failed to connect to the database.\n");
    process.exit(1);
  });