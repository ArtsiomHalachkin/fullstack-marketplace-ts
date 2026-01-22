import { Server, Socket } from "socket.io";
import * as http from "node:http";
import { orderService } from "../services/order.service"; 
import { ChatMessageDto } from "../types/dto/order.dto";

let io: Server | null = null;

export const orderSocketServer = {

    init(httpServer: http.Server) {
        // 1. Initialize Server
        io = new Server(httpServer, {
            cors: {
                // Splits string into array, or defaults to allow all
                origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*"
            }
        });

        io.on("connection", (socket: Socket) => {
            console.log("Chat: Connection " + socket.id);

            // --- EVENT: JOIN CHAT (SUBSCRIBE) ---
            socket.on('subscribeToOrder', (orderId: string) => {
                if (!orderId) return;
                
                console.log(`Socket ${socket.id} joining room: ${orderId}`);
                
                // NATIVE LOGIC: This puts the socket into a "room" named after the orderId
                socket.join(orderId); 
            });

            // --- EVENT: SEND MESSAGE ---
            socket.on('sendMessage', async (payload: { orderId: string, message: ChatMessageDto }) => {
                console.log(`Chat: Msg in order ${payload.orderId}`);
                
                // 1. Persistence: Save to Database
                try {
                    await orderService.addMessageToOrder(payload.orderId, payload.message);
                } catch (e) {
                    console.error("Failed to save message:", e);
                    // Optional: Emit error back to sender
                    return;
                }

                // 2. Broadcast: Send to everyone in the room
                // 'io.to(room)' sends to everyone including the sender
                // 'socket.to(room)' sends to everyone EXCEPT the sender
                if (io) {
                    io.to(payload.orderId).emit('orderMessage', payload.message);
                }
            });

            // --- EVENT: DISCONNECT ---
            socket.on('disconnect', () => {
                // Socket.io automatically leaves rooms on disconnect
                console.log("Chat: Disconnect " + socket.id);
            });
        });
    }
}