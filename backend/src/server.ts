import 'dotenv/config.js';
import app from "./app.js";
import * as http from "node:http";
import {initSocket} from "./socket.js";


const main = async () => {

    const PORT = process.env.PORT || 5000;
    // a plain Node http.Server; Express is only its request handler
    const httpServer = http.createServer(app);

    initSocket(httpServer);

    //Listening to Http server
    httpServer.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    })

}
main().catch((err) => {
    console.error("Error starting the server:", err);
});
