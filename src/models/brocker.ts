import { Server, Socket } from "socket.io";
import { Phase } from "../states/phase";
import { Player, PlayersState } from "./player";

export class Brocker {

    private phase: Phase;
    private playersMap: Map<string, Player> = new Map()
    public playerVotes: Map<string, Set<string>> = new Map()

    public questionCards: string[]
    public answerCards: string[]

    public io: Server
    private playersState: PlayersState

    constructor(io: Server, phase: Phase) {
        this.io = io
        this.playersState = new PlayersState()
        this.transitionTo(phase)

        this.questionCards = ["question1", "question2", "question3", "question4", "question5"]
        this.answerCards = [...this.getFullAlphabet()]
    }

    public transitionTo(phase: Phase): void {
        this.playersState.notify()
        this.phase = phase;
        this.phase.setContext(this);
    }

    public digestMessage(message: string, socket: Socket, player: Player): void {
        this.phase.digestMessage(message, socket, player);
    }

    public getFullAlphabet = (): string[] => {
        const uppercase = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        const lowercase = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
        return [...uppercase, ...lowercase];
    }

    public addPlayer = (player: Player) => {
        this.playersMap.set(player.name, player)
        this.playersState.attach(player)
        return player
    }

    public getPlayer = (name: string) => {
        return this.playersMap.get(name)
    }

    public canTransition = (): boolean => {
        return Array.from(this.playersMap.values()).every(player => player.ready);
    }
}