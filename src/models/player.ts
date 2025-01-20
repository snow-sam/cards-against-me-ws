export class Player implements Observer {
    private cards: Set<string>;
    public name: string;
    public ready: boolean

    constructor(name: string) {
        this.name = name;
        this.cards = new Set;
        this.ready = false
    }

    public getCards() {
        return this.cards;
    }

    public updateCards(cards: string[]) {
        this.cards = new Set([...this.cards, ...cards]);
        return this
    }

    public removeCard(card: string) {
        this.cards.delete(card)
        return this
    }

    public setReady(isReady: boolean = true){
        this.ready = isReady
        return this
    }

    public update(subject: Subject){
        this.setReady(subject.state)
    }
}

export class PlayersState implements Subject {
    public state: boolean = false;
    private observers: Observer[] = [];

    public attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (isExist) return;

        this.observers.push(observer);
    }

    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) return;

        this.observers.splice(observerIndex, 1);
    }

    public notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }
}