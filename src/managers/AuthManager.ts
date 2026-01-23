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
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        
        if (code) {
            await this.handleAuthCallback(code);
        } else {
            // Restore existing session from localStorage
            const existingToken = localStorage.getItem("__convexAuthJWT");
            if (existingToken) {
                this.client.setAuth(async () => existingToken);
            }
        }

        this.client.onUpdate(api.users.viewer, {}, (user) => {
            this.currentUser = user;
            this.isLoading = false;
            this.notify();
        });
    }

    private async handleAuthCallback(code: string): Promise<void> {
        const verifier = localStorage.getItem("__convexAuthOAuthVerifier");
        if (!verifier) {
            console.error("No verifier found for code exchange");
            return;
        }

        try {
            const result: any = await this.client.action(api.auth.signIn, {
                params: { code },
                verifier
            });
            console.log("Token exchange result:", result);
            
            // Set auth if tokens returned
            if (result?.tokens?.token) {
                localStorage.setItem("__convexAuthJWT", result.tokens.token);
                if (result.tokens.refreshToken) {
                    localStorage.setItem("__convexAuthRefreshToken", result.tokens.refreshToken);
                }
                this.client.setAuth(async () => result.tokens.token);
            }
            
            // Clear URL and verifier
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
                // Store verifier for callback
                if (result.verifier) {
                    localStorage.setItem("__convexAuthOAuthVerifier", result.verifier);
                }
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
