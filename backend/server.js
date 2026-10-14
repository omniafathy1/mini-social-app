const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./src/app");
const driver = require("./src/config/db");
const { initSocket } = require("./src/socket/socketManager");

const PORT = process.env.PORT || 3000;

// Express and Socket.IO share the same HTTP server and port.
const httpServer = http.createServer(app);
initSocket(httpServer);

async function startServer() {
  try {
    await driver.verifyConnectivity();
    console.log("Connected to CognoDB successfully! 🎉");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.io is ready for real-time connections`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

startServer();