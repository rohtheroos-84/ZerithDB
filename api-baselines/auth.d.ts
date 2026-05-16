import { EventEmitter, Identity, ZerithDBConfig, Signature } from 'zerithdb-core';

type AuthEvents = {
    "identity:change": Identity | null;
};
/**
 * Manages the local Ed25519 keypair identity for this ZerithDB instance.
 * Identities are stored in localStorage as hex-encoded keys.
 * No servers involved — identity is fully self-sovereign.
 */
declare class AuthManager extends EventEmitter<AuthEvents> {
    private readonly storageKey;
    private _identity;
    private privateKeyBytes;
    constructor(config: ZerithDBConfig);
    /**
     * Sign in to ZerithDB.
     * - If a keypair already exists in localStorage, it is loaded.
     * - If not, a new Ed25519 keypair is generated and stored.
     *
     * @returns The current {@link Identity}
     */
    signIn(): Promise<Identity>;
    /**
     * Generate a brand-new identity, replacing any existing one.
     * ⚠️ This is destructive — the old identity cannot be recovered.
     */
    generateIdentity(): Promise<Identity>;
    /**
     * Sign arbitrary bytes with the local private key.
     * Used to authenticate sync updates sent to peers.
     */
    sign(data: Uint8Array): Promise<Signature>;
    /**
     * Verify a signature against a public key.
     *
     * @param data - The original data that was signed
     * @param signature - Hex-encoded signature
     * @param publicKey - Hex-encoded Ed25519 public key
     */
    verify(data: Uint8Array, signature: Signature, publicKey: string): Promise<boolean>;
    /** The currently loaded identity, or null if not signed in */
    get identity(): Identity | null;
    /** Sign out and clear the stored identity */
    signOut(): void;
    private buildIdentity;
    private saveToStorage;
    private loadFromStorage;
}

export { AuthManager };
