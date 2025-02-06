interface Message {
    type: "server" | "room" | "client";
    message: string;
}

interface NamedMessage extends Message {
    name: string;
}

export class RoomMessage implements Message {
    type: Message['type'] = 'room';
    message: Message['message'];

    constructor(message: Message['message']) {
        this.message = message;
    }
}

export class ServerMessage implements Message {
    type: Message['type'] = 'server';
    message: Message['message'];

    constructor(message: Message['message']) {
        this.message = message;
    }
}


export class ClientMessage implements NamedMessage {
    type: NamedMessage['type'] = "client";
    message: NamedMessage['message'];
    name: NamedMessage['name'];

    constructor(message: NamedMessage['message'], name: NamedMessage['name']) {
        this.message = message;
        this.name = name;
    }
}
