import { Server } from 'socket.io';
import { Brocker } from './models/brocker';
import { StartPhase } from './states/phase';
import { Player } from './models/player';

import express from "express"
import { createServer } from "http"

const app = express();
const server = createServer(app);


const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const brocker = new Brocker(io, new StartPhase())

io.on("connection", (socket) => {
    const name = socket.handshake.query.name as string || ""

    socket.data = { name }
    io.emit("data", { type: "room", message: `${name} has entered` })

    const player = brocker.addPlayer(new Player(name))

    socket.on("message", (message: string) => {
        brocker.digestMessage(message, socket, player)
    })

    socket.on("disconnect", () => {
        io.emit("data", { type: "room", message: `${name} has left` })
        brocker.removePlayer(player)
    })
})

const HOST = "0.0.0.0"
const PORT = 4000

server.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});