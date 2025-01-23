import { Socket } from "socket.io";
import { Brocker } from "../models/brocker";
import { Player } from "../models/player";

export abstract class Phase {
    protected context: Brocker;

    public setContext(context: Brocker) {
        this.context = context;
    }

    public abstract digestMessage(message: string, socket: Socket, player: Player): void;

}

export class StartPhase extends Phase {
    public digestMessage(message: string, socket: Socket, player: Player): void {
        if (message.toLowerCase() !== "ready") return

        const { answerCards, questionCards, canTransition, io } = this.context
        const cardsLeft = 10 - player.getCards().size

        if (cardsLeft > 0) player.updateCards([...answerCards.splice(-cardsLeft)])
        socket.emit("cards", [...player.getCards()])
        console.log(player.getCards())
        player.setReady()

        io.emit("data", { type: "client", message, name: player.name })
        if (canTransition()) {
            io.emit("data", { type: "server", message: questionCards.pop() })
            this.context.transitionTo(new SendingPhase())
        }
    }
}

export class SendingPhase extends Phase {
    public digestMessage(message: string, socket: Socket, player: Player): void {
        const { playerVotes, canTransition, io } = this.context
        if (!player.getCards()?.has(message)) return

        playerVotes.set([message, player.name], new Set())
        player.removeCard(message).setReady()

        if (canTransition()) {
            let time = 1000
            io.emit("cards", [...playerVotes.keys()].map(([card, name]) => card))
            playerVotes.forEach((_, key) => {
                setTimeout(() => {
                    io.emit("data", { type: "client", message: key[0], name: key[1] })
                }, time)
                time += 1000
            })
            setTimeout(() => {
                io.emit("data", { type: "room", message: "Votação iniciada" })
            }, time)
            this.context.transitionTo(new VotingPhase())
        }
    }
}

export class VotingPhase extends Phase {
    public digestMessage(message: string, socket: Socket, player: Player): void {
        const { playerVotes, canTransition, io } = this.context
        playerVotes.get([message, player.name])?.add(player.name)

        player.setReady()

        io.emit("data", { type: "client", message, name: player.name })
        if (canTransition()) {
            io.emit("data", { type: "server", message: "Winner" })
            io.emit("cards", ["Ready"])
            playerVotes.clear()
            this.context.transitionTo(new StartPhase());
        }
    }
}