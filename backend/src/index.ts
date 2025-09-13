import http from "http";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { config } from "./config/config.js";
import { Server } from "socket.io";
import initSocket from "./socket/socket.js";

// Create http server from express app
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: [
      `${config.corsOrigin}`
    ],
    credentials: true,
  },
});

// Attach socket handler
initSocket(io);

// Connect to database
connectDB()
  .then(() => {
    server.listen(config.port, () => {
      console.log(`\n✅ Server running at: http://localhost:${config.port}\n`);
    });
  })
  .catch(() => {
    console.error("\n❌ Failed to connect to the database.\n");
    process.exit(1);
  });