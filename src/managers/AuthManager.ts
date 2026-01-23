import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export class AuthManager {
    private client: ConvexClient;
    public currentUser: any = null;
    public isLoading: boolean = true;
    private subscribers: Set<() => void> = new Set();

    constructor(client: ConvexClient) {
        this.client = client;
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
        try {
            const result: any = await this.client.action(api.auth.signIn, { provider });
            if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                 console.error("Sign in failed: No redirect URL returned", result);
            }
        } catch (error) {
            console.error("Sign in error:", error);
        }
    }

    public async signOut(): Promise<void> {
        await this.client.action(api.auth.signOut, {});
        this.currentUser = null;
        this.notify();
    }
}
