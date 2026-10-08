import {Server} from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: Server| null = null

export function initSocket(httpServer: HttpServer){
    //It starts as null because io can't exist until the HTTP server does.

    //Create webSocket server
    io = new Server(httpServer,  {
        cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true },
    });

    //Register connection hanler
    io.on("connection", socket => {

        //socket.on(eventName, callback): listen for a message
        //      It takes two arguments:
        //   1. Event name, a string that labels the message you're waiting for.
        //   2. Callback, the function that runs when a message with that label arrives. Its parameters are whatever data the sender attached.
        socket.on("poll:join", (slug) => {
                if(typeof slug !== "string"){
                    return
                }
                else{
                    socket.join(`poll:${slug}`)
                }
        })
        socket.on("poll:leave", (slug) => {
            if(typeof slug !== "string"){
                return
            }
            else{
                socket.leave(`poll:${slug}`)
            }
        })

    })
}
export function getIO() {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
}
