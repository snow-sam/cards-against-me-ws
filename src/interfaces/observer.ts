interface Observer {
    update(subject: Subject): void;
}

interface Subject {
    state: any;
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
}