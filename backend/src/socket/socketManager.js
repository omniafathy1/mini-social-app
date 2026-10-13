const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/token");

let io = null;

function initSocket(httpServer) {
  const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  const allowedOrigins = [
    clientOrigin,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Check token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    function authenticateSocket(authToken) {
      if (!authToken) return null;
      try {
        const decoded = verifyAccessToken(authToken);
        if (decoded?.userId) {
          socket.join(decoded.userId);
          socket.userId = decoded.userId;
          return decoded.userId;
        }
      } catch (error) {
        // Token invalid or expired
      }
      return null;
    }

    if (token) {
      authenticateSocket(token);
    }

    // Support dynamic re-authentication upon token refresh
    socket.on("authenticate", (data) => {
      const newToken = data?.token;
      if (newToken) {
        const userId = authenticateSocket(newToken);
        if (userId) {
          socket.emit("authenticated", { success: true });
        } else {
          socket.emit("authenticated", { success: false, message: "Invalid or expired token" });
        }
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized yet. Call initSocket(server) first.");
  }
  return io;
}

module.exports = { initSocket, getIO };