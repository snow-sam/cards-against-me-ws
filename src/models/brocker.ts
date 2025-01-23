import { Server, Socket } from "socket.io";
import { Phase } from "../states/phase";
import { Player, PlayersState } from "./player";
import { deckShuffle, getJson } from "../utils"
import { ANSWER_DECK, QUESTION_DECK } from "../constants"


export class Brocker {

    private phase: Phase;
    private playersMap: Map<string, Player> = new Map()
    public playerVotes: Map<[string, string], Set<string>> = new Map()

    public questionCards: string[]
    public answerCards: string[]

    public io: Server
    private playersState: PlayersState

    constructor(io: Server, phase: Phase) {
        this.io = io
        this.playersState = new PlayersState()
        this.transitionTo(phase)

        this.questionCards = deckShuffle(getJson(QUESTION_DECK))
        this.answerCards = deckShuffle(getJson(ANSWER_DECK))
    }

    public transitionTo(phase: Phase): void {
        this.playersState.notify()
        this.phase = phase;
        this.phase.setContext(this);
    }

    public digestMessage(message: string, socket: Socket, player: Player): void {
        this.phase.digestMessage(message, socket, player);
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

    public getPlayer = (name: string) => {
        return this.playersMap.get(name)
    }

    public canTransition = (): boolean => {
        return Array.from(this.playersMap.values()).every(player => player.ready);
    }
}