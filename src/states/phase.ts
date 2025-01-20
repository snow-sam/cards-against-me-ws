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

        socket.emit("data", "cards", [...player.getCards()])

        player.setReady()

        if (canTransition()) {
            io.emit("data", "message", questionCards.pop())
            this.context.transitionTo(new SendingPhase())
        }
    }
}

export class SendingPhase extends Phase {
    public digestMessage(message: string, socket: Socket, player: Player): void {
        const { playerVotes, canTransition, io } = this.context
        if (!player.getCards()?.has(message)) return

        playerVotes.set(message, new Set())

        player.removeCard(message).setReady()
        console.log(message)

        if (canTransition()) {
            io.emit("data", "message", [...playerVotes.keys()])
            this.context.transitionTo(new VotingPhase())
        }
    }
}

export class VotingPhase extends Phase {
    public digestMessage(message: string, socket: Socket, player: Player): void {
        const { playerVotes, canTransition, io } = this.context
        const votingCards = new Set(playerVotes.keys())
        if (!votingCards.has(message)) return

        playerVotes.get(message).add(player.name)

        player.setReady()

        console.log(message)

        if (canTransition()) {
            io.emit("data", "message", "Winner")
            playerVotes.clear()
            this.context.transitionTo(new StartPhase());
        }
    }
}