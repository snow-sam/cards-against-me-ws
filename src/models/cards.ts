export class Card {
    public text: string
    public author: string
    public voters: Set<string> = new Set()

    constructor (text: string, author: string) {
        this.text = text
        this.author = author
    }
} 