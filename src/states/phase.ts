import { Brocker } from "../models/brocker";
import { Player } from "../models/player";
import { Card } from "../models/cards";

export abstract class Phase {
    protected context: Brocker;

    public setContext(context: Brocker) {
        this.context = context;
    }

    public abstract digestMessage(message: string, player: Player): void;
    public abstract trasition(): void;
}

export class StartPhase extends Phase {
    public digestMessage(message: string, player: Player): void {
        const { completePlayerCards } = this.context

        completePlayerCards(player)
        player.setReady()
        this.trasition()
    }

    public trasition(): void {
        const { server, questionCards, canTransition } = this.context
        if (!canTransition()) return

        server.emitServerMessage(questionCards.pop())
        this.context.transitionTo(new SendingPhase())
    }
}

export class SendingPhase extends Phase {
    public digestMessage(message: string, player: Player): void {
        const { playerVotes } = this.context

        const isPlayerCard = player.getCards()?.has(message)
        if (!isPlayerCard) return

        playerVotes.set(message, new Card(message, player.name))
        player.removeCard(message).setReady()
        this.trasition()
    }

    public trasition(): void {
        const { server, playerVotes, canTransition } = this.context
        if (!canTransition()) return

        let time = 1000
        server.sendCards([...playerVotes.keys()])
        playerVotes.forEach(card => {
            setTimeout(server.emitClientMessage, time, card.text, card.author)
            time += 1000
        })
        setTimeout(server.emitRoomMessage, time, "Votação iniciada")
        this.context.transitionTo(new VotingPhase())
    }
}

export class VotingPhase extends Phase {
    public digestMessage(message: string, player: Player): void {
        const { playerVotes, server } = this.context

        server.emitClientMessage(message, player.name)
        playerVotes.get(message)?.voters.add(player.name)
        player.setReady()
        this.trasition()
    }

    public trasition(): void {
        const { server, playerVotes, canTransition } = this.context
        if (!canTransition()) return

        // Calcular vencedor
        let winnerCards: Map<number, Card[]> = new Map()
        let mostVotes = 0

        playerVotes.forEach(card => {
            const nVotes = card.voters.size

            if(nVotes > mostVotes) mostVotes = nVotes
            if(!winnerCards.has(nVotes)) winnerCards.set(nVotes, [])
            winnerCards.get(nVotes).push(card)
        })

        playerVotes.clear()

        const winners = winnerCards.get(mostVotes)

        if (winners.length !== 1) {
            winners.forEach(card => playerVotes.set(card.text, card))
            server.emitRoomMessage("Votação empatada")
            server.emitRoomMessage("Escolha uma das opções de desempate")
            server.sendCards(winners.map(card => card.text))
            this.context.transitionTo(new VotingPhase());
            return
        }

        server.emitRoomMessage(`${winners.pop().author} venceu`)
        server.sendCards([])
        this.context.transitionTo(new StartPhase());
    }
}

export class DrawPhase {
    public digestMessage(message: string, player: Player): void {
        return
    }
    public trasition(): void {
        return
    }
}
