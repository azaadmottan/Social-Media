const url = require('url');
const querystring = require('querystring');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { userOnline, userOffline, checkOnlineStatus, createRoom, joinRoom, leaveRoom, sendMessage, recentChat, createRoomAndSendJobMessage } = require("./chatController");

const handleSocketEvents = (io) => {
    io.on('connection', async (socket) => {
        //Socket Connect
        try {
            const token = socket.handshake.query.token;
            if (token) {
                console.log(`UserChatToken: ${token} and  SocketID: ${socket.id} is connected`);
                // Update user status to online
                await userOnline(socket, io, token);
                const connectedRoom = await connectedRoomID(socket, io, token);
                if (connectedRoom && Array.isArray(connectedRoom)) {
                    connectedRoom.forEach(room => {
                        io.to(room.roomID).emit('CloseConnectionListner', { isOnline: true, room: room.roomID });
                    });
                } else {
                    console.error("No connected rooms found or invalid format.");
                }
            }
        }
        catch (error) {
            console.error("Error in connection process:", error);
        }

        //Socket Disconnect
        socket.on('disconnect', async () => {
            try {
                const token = socket.handshake.query.token;
                if (token) {
                    console.log(`USER DISCONNECT: ${token} disconnected`);
                    // Update user status to offline
                    await userOffline(socket, io, token);
                    const connectedRoom = await connectedRoomID(socket, io, token);
                    if (connectedRoom && Array.isArray(connectedRoom)) {
                        connectedRoom.forEach(room => {
                            io.to(room.roomID).emit('CloseConnectionListner', { isOnline: false, room: room.roomID });
                        });
                    } else {
                        console.error("No connected rooms found or invalid format.");
                    }
                }
            } catch (error) {
                console.error("Error handling disconnect:", error);
            }
        });

        socket.on("checkOnlineStatus", async (request, callback) => {
            checkOnlineStatus(socket, io, request, callback);
        });

        socket.on("createRoom", async (request, callback) => {
            createRoom(socket, io, request, callback);
        });

        socket.on("joinRoom", async (request, callback) => {
            joinRoom(socket, io, request, callback);
        });

        socket.on("leaveRoom", async (request, callback) => {
            leaveRoom(socket, io, request, callback);
        });

        socket.on("sendMessage", async (request, callback) => {
            sendMessage(socket, io, request, callback);
        });

        socket.on("recentChat", async (request, callback) => {
            recentChat(socket, io, request, callback);
        });

        socket.on("createRoomAndSendJobMessage", async (request, callback) => {

            createRoomAndSendJobMessage(socket, io, request, callback);
        });
    });
}

module.exports = {
    handleSocketEvents
};