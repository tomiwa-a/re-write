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
            const token = await this.getTokenOrRefresh();
            if (token) {
                this.client.setAuth(async () => {
                    return await this.getTokenOrRefresh() || "";
                });
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
                this.setToken(result.tokens.token, result.tokens.refreshToken);
            }
            
            window.history.replaceState({}, "", window.location.pathname);
            localStorage.removeItem("__convexAuthOAuthVerifier");
        } catch (error) {
            console.error("Token exchange failed:", error);
        }
    }

    private setToken(token: string, refreshToken?: string) {
        localStorage.setItem("__convexAuthJWT", token);
        if (refreshToken) {
            localStorage.setItem("__convexAuthRefreshToken", refreshToken);
        }
        this.client.setAuth(async () => token);
    }

    public async getTokenOrRefresh(): Promise<string | null> {
        const token = localStorage.getItem("__convexAuthJWT");
        if (token && this.isTokenValid(token)) {
            return token;
        }

        return await this.refreshToken();
    }

    private isTokenValid(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Buffer of 2 minutes
            return payload.exp * 1000 > Date.now() + 2 * 60 * 1000;
        } catch (e) {
            return false;
        }
    }


    private async refreshToken(): Promise<string | null> {
        const refreshToken = localStorage.getItem("__convexAuthRefreshToken");
        if (!refreshToken) return null;

        try {
            const result: any = await this.client.action(api.auth.signIn, { refreshToken });
            
            if (result?.tokens?.token) {
                 this.setToken(result.tokens.token, result.tokens.refreshToken);
                 return result.tokens.token;
            }
            return null;
        } catch (error) {
            console.error("Failed to refresh token:", error);
            this.signOut(); 
            return null;
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
