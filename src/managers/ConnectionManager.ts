export class ConnectionManager {
    private _isOnline: boolean = navigator.onLine;
    private subscribers: Set<(isOnline: boolean) => void> = new Set();

    constructor() {
        window.addEventListener("online", () => {
            this._isOnline = true;
            this.notify();
        });
        window.addEventListener("offline", () => {
            this._isOnline = false;
            this.notify();
        });
    }

    get isOnline(): boolean {
        return this._isOnline;
    }

    subscribe(callback: (isOnline: boolean) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify(): void {
        this.subscribers.forEach(cb => cb(this._isOnline));
    }
}

export const connectionManager = new ConnectionManager();
