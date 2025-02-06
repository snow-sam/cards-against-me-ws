import { Server } from 'socket.io';
import { Brocker } from './models/brocker';
import { StartPhase } from './states/phase';
import { Player } from './models/player';

import express from "express"
import { createServer } from "http"

const app = express();
const server = createServer(app);

const socketIdPlayerMap = new Map()
const roomBrockerMap = new Map()

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on("connection", (socket) => {
    const name = socket.handshake.query.name as string || ""
    const roomId = socket.handshake.query.roomId as string || ""

    socket.data = { name, roomId: `room-${roomId}` }
    socket.join(`room-${roomId}`)

    socket.on("message", (message: string) => {
        const brocker = roomBrockerMap.get(socket.data.roomId)
        brocker.digestMessage(message, socketIdPlayerMap.get(socket.id))
    })
})

io.of("/").adapter.on("create-room", (roomId) => {
    if (!/room-\d+$/.test(roomId)) return
    roomBrockerMap.set(roomId, new Brocker(io, roomId, new StartPhase()))
});

io.of("/").adapter.on("join-room", (roomId, id) => {
    if (!roomBrockerMap.has(roomId)) return
    const brocker = roomBrockerMap.get(roomId)
    const socket = io.sockets.sockets.get(id)
    const player = brocker.addPlayer(new Player(socket.data.name, id))
    socketIdPlayerMap.set(id, player)
    brocker.server.emitRoomMessage(`${player.name} has entered`)
});

io.of("/").adapter.on("delete-room", (roomId) => {
    if (!roomBrockerMap.has(roomId)) return
    roomBrockerMap.delete(roomId);
});

io.of("/").adapter.on("leave-room", (roomId, id) => {
    if (!roomBrockerMap.has(roomId)) return
    const brocker = roomBrockerMap.get(roomId)
    const player = socketIdPlayerMap.get(id)
    brocker.server.emitRoomMessage(`${player.name} has left`)
    brocker.removePlayer(player)
    socketIdPlayerMap.delete(id)
});

const HOST = "0.0.0.0"
const PORT = 4000

app.get("/health", (req, res) => {
    res.sendStatus(200)
})

server.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});