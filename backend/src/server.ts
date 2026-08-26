import 'dotenv/config.js';
import app from "./app.js";


const main = async () => {

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
main().catch((err) => {
    console.error("Error starting the server:", err);
});

console.log("Hello from server.ts");