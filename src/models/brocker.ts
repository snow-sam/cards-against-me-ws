import { Card } from "./cards";
import { Server } from "socket.io";
import { Phase } from "../states/phase";
import { Player, PlayersState } from "./player";
import { deckShuffle, getJson } from "../utils"
import { ANSWER_DECK, QUESTION_DECK } from "../constants"
import { ClientMessage, ServerMessage, RoomMessage } from "../models/messages"

class ServerFacade {
    private server: Server
    private roomId: string

    constructor(server: Server, roomId: string) {
        this.server = server
        this.roomId = roomId
    }

    public emitClientMessage = (message: string, author: string) => {
        this.server.to(this.roomId).emit("data", new ClientMessage(message, author))
    }

    public emitServerMessage = (message: string) => {
        this.server.to(this.roomId).emit("data", new ServerMessage(message))
    }

    public emitRoomMessage = (message: string) => {
        this.server.to(this.roomId).emit("data", new RoomMessage(message))
    }

    public sendCards = (cards: string[], socketID: string = null) => {
        this.server.to(!socketID ? this.roomId : socketID).emit("cards", cards)
    }
}

export class Brocker {

    private phase: Phase;
    private playersMap: Map<string, Player> = new Map()
    public playerVotes: Map<string, Card> = new Map()

    public questionCards: string[]
    public answerCards: string[]

    public server: ServerFacade
    private playersState: PlayersState

    constructor(io: Server, roomId: string, phase: Phase) {
        this.server = new ServerFacade(io, roomId)
        this.playersState = new PlayersState()
        this.transitionTo(phase)

        this.questionCards = deckShuffle(getJson(QUESTION_DECK))
        this.answerCards = deckShuffle(getJson(ANSWER_DECK))
    }

    public transitionTo(phase: Phase): void {
        this.phase = phase;
        this.phase.setContext(this);
        this.playersState.notify()
    }

    public digestMessage(message: string, player: Player): void {
        this.phase.digestMessage(message, player);
    }

    public addPlayer = (player: Player) => {
        this.playersMap.set(player.name, player)
        this.playersState.attach(player)
        return player
    }

    public removePlayer = (player: Player) => {
        this.playersMap.delete(player.name)
        this.playersState.detach(player)
        return player
    }

    public completePlayerCards = (player: Player) => {
        const { answerCards, server } = this
        const currentPlayerCards = player.getCards()
        const hasEnoughtCards = currentPlayerCards.size >= 10
        
        if (hasEnoughtCards) return 

        // At this game, the player always have 10 cards
        const nCardsMissing = 10 - currentPlayerCards.size
        player.updateCards([...answerCards.splice(-nCardsMissing)])
        
        server.sendCards([...player.getCards()], player.socketID)
    }

    public canTransition = (): boolean => {
        return Array.from(this.playersMap.values()).every(player => player.ready);
    }
}