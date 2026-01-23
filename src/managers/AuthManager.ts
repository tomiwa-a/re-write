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
        
        console.log("[Auth] Setting up user subscription...");
        this.unsubscribe = this.client.onUpdate(api.users.viewer, {}, (user) => {
            console.log("[Auth] Viewer query result:", user);
            this.currentUser = user;
            this.isLoading = false;
            this.notify();
        });
    }

    private async handleAuthCallback(code: string): Promise<void> {
        console.log("[Auth] Handling callback with code:", code.substring(0, 10) + "...");
        const verifier = localStorage.getItem("__convexAuthOAuthVerifier");
        if (!verifier) {
            console.error("[Auth] No verifier found for code exchange");
            return;
        }

        try {
            console.log("[Auth] Exchanging code for token...");
            const result: any = await this.client.action(api.auth.signIn, {
                params: { code },
                verifier
            });
            console.log("[Auth] Token exchange result:", result);
            
            if (result?.tokens?.token) {
                console.log("[Auth] Got token, setting auth...");
                localStorage.setItem("__convexAuthJWT", result.tokens.token);
                if (result.tokens.refreshToken) {
                    localStorage.setItem("__convexAuthRefreshToken", result.tokens.refreshToken);
                }
                this.client.setAuth(async () => result.tokens.token);
                
                console.log("[Auth] Auth set, waiting before resubscribing...");
                await new Promise(resolve => setTimeout(resolve, 500));
                this.setupUserSubscription();
            } else {
                console.error("[Auth] No token in result:", result);
            }
            
            window.history.replaceState({}, "", window.location.pathname);
            localStorage.removeItem("__convexAuthOAuthVerifier");
        } catch (error) {
            console.error("[Auth] Token exchange failed:", error);
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
