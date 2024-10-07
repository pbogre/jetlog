class TokenStorageClass {
    private tokenKey = "token";

    getToken(): string|null {
        const token = sessionStorage.getItem(this.tokenKey);
        return token;
    }

    loadStoredToken(): void {
        const token = localStorage.getItem(this.tokenKey);
        if (token !== null) {
            this.storeToken(token);
        }
    }

    storeToken(token: string, remember: boolean = false): void {
        sessionStorage.setItem(this.tokenKey, token);
        if (remember) {
            localStorage.setItem(this.tokenKey, token);
        }
    }

    clearToken(): void {
        sessionStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenKey);
    }
}
const TokenStorage = new TokenStorageClass();
export default TokenStorage;
