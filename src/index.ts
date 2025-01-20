import { Server } from 'socket.io';
import { Brocker } from './models/brocker';
import { StartPhase } from './states/phase';
import { Player } from './models/player';

const port = process.env.PORT || 3000;


const io = new Server(port as number, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const brocker = new Brocker(io, new StartPhase())

io.on("connection", (socket) => {
    const name = socket.handshake.query.name as string || ""
    socket.data = { name }
    io.emit("data", "room", `${name} has entered`)

    const player = brocker.addPlayer(new Player(name))
    
    socket.on("message", (message: string) => {
        brocker.digestMessage(message, socket, player)
    })
})