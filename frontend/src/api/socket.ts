import io from "socket.io-client";

//autoConnect: false means the socket doesn't connect the moment the file is imported. You'll call socket.connect() yourself from the results page, so only people viewing results hold a connection.
export const socket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true, autoConnect: false })