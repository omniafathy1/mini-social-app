


// //ab4be0e3-bf78-4d0b-a50e-c44ff635a57c  userid
// //833e0783-2d70-4907-ad10-f80bd3658937  postid
// //89b0bea8-aad8-483a-93aa-b05e8d3660e3  commentid



const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./src/app");
const driver = require("./src/config/db");
const { initSocket } = require("./src/socket/socketManager");

const PORT = process.env.PORT || 3000;

// app.listen() في الأصل بيعمل http.Server جوّاه تلقائيًا من غير ما تشوفه
// إحنا محتاجين نعمله إحنا بإيدنا هنا، عشان نقدر نمرر نفس السيرفر لـ Socket.io كمان
// فالاتنين (Express والـ WebSocket) بيشتغلوا على نفس البورت بالظبط
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