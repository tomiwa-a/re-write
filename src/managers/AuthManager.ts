import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export class AuthManager {
    private client: ConvexClient;
    public currentUser: any = null;
    public isLoading: boolean = true;
    private subscribers: Set<() => void> = new Set();
    private unsubscribe: (() => void) | null = null;

    constructor(client: ConvexClient) {
        this.client = client;
    }

    public async init(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        
        if (code) {
            await this.handleAuthCallback(code);
        } else {
            const existingToken = localStorage.getItem("__convexAuthJWT");
            if (existingToken) {
                this.client.setAuth(async () => existingToken);
            }
        }

        this.setupUserSubscription();
    }

    private setupUserSubscription(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        this.unsubscribe = this.client.onUpdate(api.users.viewer, {}, (user) => {
            this.currentUser = user;
            this.isLoading = false;
            this.notify();
        });
    }

    private async handleAuthCallback(code: string): Promise<void> {
        const verifier = localStorage.getItem("__convexAuthOAuthVerifier");
        if (!verifier) {
            return;
        }

        try {
            const result: any = await this.client.action(api.auth.signIn, {
                params: { code },
                verifier
            });
            
            if (result?.tokens?.token) {
                localStorage.setItem("__convexAuthJWT", result.tokens.token);
                if (result.tokens.refreshToken) {
                    localStorage.setItem("__convexAuthRefreshToken", result.tokens.refreshToken);
                }
                this.client.setAuth(async () => result.tokens.token);
            }
            
            window.history.replaceState({}, "", window.location.pathname);
            localStorage.removeItem("__convexAuthOAuthVerifier");
        } catch (error) {
            console.error("Token exchange failed:", error);
        }
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
            const result: any = await this.client.action(api.auth.signIn, { 
                provider,
                params: { redirectTo: "/app.html" } 
            });
            
            if (result.redirect) {
                if (result.verifier) {
                    localStorage.setItem("__convexAuthOAuthVerifier", result.verifier);
                }
                window.location.href = result.redirect;
            }
        } catch (error) {
            console.error("Sign in error:", error);
        }
    }

    public async signOut(): Promise<void> {
        await this.client.action(api.auth.signOut, {});
        localStorage.removeItem("__convexAuthJWT");
        localStorage.removeItem("__convexAuthRefreshToken");
        this.currentUser = null;
        this.notify();
    }
}
