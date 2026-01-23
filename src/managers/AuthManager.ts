import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export class AuthManager {
    private client: ConvexClient;
    public currentUser: any = null;
    public isLoading: boolean = true;
    private subscribers: Set<() => void> = new Set();
    private siteUrl: string;

    constructor(client: ConvexClient) {
        this.client = client;
        this.siteUrl = import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") || "";
    }

    public async init(): Promise<void> {
        this.client.onUpdate(api.users.viewer, {}, (user) => {
            this.currentUser = user;
            this.isLoading = false;
            this.notify();
        });
    }

    public subscribe(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify(): void {
        this.subscribers.forEach(cb => cb());
    }

    public async signIn(provider: "google" | "github"): Promise<void> {
        const url = `${this.siteUrl}/api/auth/signin/${provider}`;
        const form = document.createElement("form");
        form.action = url;
        form.method = "POST";
        document.body.appendChild(form);
        form.submit();
    }

    public async signOut(): Promise<void> {
        await this.client.action(api.auth.signOut, {});
        this.currentUser = null;
        this.notify();
    }
}
