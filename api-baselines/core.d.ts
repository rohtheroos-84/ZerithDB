type Listener<T> = (event: T) => void;
/**
 * Strictly typed event emitter.
 * `T` should be a discriminated union or a record of event-name to payload.
 *
 * @example
 * ```typescript
 * type DbEvents = {
 *   "document:inserted": { collection: string; id: string };
 *   "document:deleted": { collection: string; id: string };
 * };
 *
 * const emitter = new EventEmitter<DbEvents>();
 * emitter.on("document:inserted", ({ collection, id }) => { ... });
 * ```
 */
declare class EventEmitter<TEvents extends Record<string, unknown>> {
    private readonly listeners;
    on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this;
    once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this;
    off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this;
    emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
    removeAllListeners(event?: keyof TEvents): void;
}

/**
 * Enumeration of all structured error codes in ZerithDB.
 * Use these to handle specific error conditions in application code.
 */
declare const enum ErrorCode {
    DB_INIT_FAILED = "DB_INIT_FAILED",
    DB_WRITE_FAILED = "DB_WRITE_FAILED",
    DB_READ_FAILED = "DB_READ_FAILED",
    DB_DELETE_FAILED = "DB_DELETE_FAILED",
    DB_MIGRATION_FAILED = "DB_MIGRATION_FAILED",
    DB_QUOTA_EXCEEDED = "DB_QUOTA_EXCEEDED",
    SYNC_INIT_FAILED = "SYNC_INIT_FAILED",
    SYNC_APPLY_FAILED = "SYNC_APPLY_FAILED",
    SYNC_ENCODE_FAILED = "SYNC_ENCODE_FAILED",
    NETWORK_SIGNALING_FAILED = "NETWORK_SIGNALING_FAILED",
    NETWORK_PEER_TIMEOUT = "NETWORK_PEER_TIMEOUT",
    NETWORK_PEER_DISCONNECTED = "NETWORK_PEER_DISCONNECTED",
    NETWORK_WEBRTC_FAILED = "NETWORK_WEBRTC_FAILED",
    NETWORK_TRANSPORT_DOWNGRADE = "NETWORK_TRANSPORT_DOWNGRADE",
    AUTH_KEY_GENERATION_FAILED = "AUTH_KEY_GENERATION_FAILED",
    AUTH_SIGN_FAILED = "AUTH_SIGN_FAILED",
    AUTH_VERIFY_FAILED = "AUTH_VERIFY_FAILED",
    AUTH_INVALID_SIGNATURE = "AUTH_INVALID_SIGNATURE",
    AUTH_KEY_NOT_FOUND = "AUTH_KEY_NOT_FOUND",
    SDK_INVALID_CONFIG = "SDK_INVALID_CONFIG",
    SDK_NOT_INITIALIZED = "SDK_NOT_INITIALIZED"
}
/**
 * Typed error class for all ZerithDB errors.
 * Carries a structured {@link ErrorCode} for programmatic handling.
 *
 * @example
 * ```typescript
 * try {
 *   await app.db("todos").insert(doc);
 * } catch (err) {
 *   if (err instanceof ZerithDBError && err.code === ErrorCode.DB_QUOTA_EXCEEDED) {
 *     // handle storage full
 *   }
 * }
 * ```
 */
declare class ZerithDBError extends Error {
    readonly code: ErrorCode;
    constructor(code: ErrorCode, message: string, options?: ErrorOptions);
    toString(): string;
}

interface SyncConfig {
    /**
     * WebSocket URL of the ZerithDB signaling server.
     * @default "wss://signal.zerithdb.dev"
     */
    signalingUrl?: string;
    /**
     * STUN/TURN server URLs for WebRTC ICE negotiation.
     * @default Uses Google's public STUN servers
     */
    iceServers?: RTCIceServer[];
    /**
     * Maximum number of peers to connect to per room.
     * Full-mesh topology — costs O(n²) connections.
     * @default 10
     */
    maxPeers?: number;
    /**
     * Signaling transport preference.
     * - `"auto"`      — Try WebSocket first, fall back to HTTP long-polling (default)
     * - `"websocket"` — WebSocket only (original behavior)
     * - `"polling"`   — HTTP long-polling only (for strict firewall environments)
     * @default "auto"
     */
    transport?: "auto" | "websocket" | "polling";
}
interface AuthConfig {
    /**
     * Storage key prefix for the identity keypair in localStorage.
     * @default "__zerithdb_identity"
     */
    storageKey?: string;
}
interface NetworkConfig {
    /**
     * Whether to automatically reconnect when a peer disconnects.
     * @default true
     */
    autoReconnect?: boolean;
    /**
     * Initial backoff delay in ms for reconnection.
     * @default 1000
     */
    reconnectDelay?: number;
}
interface ZerithDBConfig {
    /**
     * Unique identifier for this application's data namespace.
     * This scopes all IndexedDB storage and P2P rooms.
     * Must be stable — changing it is equivalent to starting fresh.
     */
    appId: string;
    sync?: SyncConfig;
    auth?: AuthConfig;
    network?: NetworkConfig;
    /**
     * Log level for internal ZerithDB diagnostics.
     * @default "warn"
     */
    logLevel?: "debug" | "info" | "warn" | "error" | "silent";
}

/** Unique identifier for a document — UUID v7 string */
type DocumentId = string;
/** Name of a collection within ZerithDB */
type CollectionName = string;
/** Base document shape. All stored documents have an `_id` field added automatically. */
type Document<T extends Record<string, any> = Record<string, any>> = T & {
    _id: DocumentId;
    _createdAt: number;
    _updatedAt: number;
};
/**
 * MongoDB-style query filter operators.
 * Nested object fields are matched by equality.
 */
type QueryFilter<T extends Record<string, any>> = {
    [K in keyof T]?: T[K] | {
        $eq: T[K];
    } | {
        $ne: T[K];
    } | {
        $gt: T[K];
    } | {
        $gte: T[K];
    } | {
        $lt: T[K];
    } | {
        $lte: T[K];
    } | {
        $in: T[K][];
    } | {
        $nin: T[K][];
    };
};
/** Partial update spec — only specified fields are modified */
type UpdateSpec<T extends Record<string, any>> = {
    $set?: Partial<T>;
    $unset?: {
        [K in keyof T]?: true;
    };
};
type InsertResult = {
    id: DocumentId;
};
type FindResult<T extends Record<string, any>> = {
    documents: Document<T>[];
    count: number;
};

/** UUID v4 peer identifier — assigned on connection */
type PeerId = string;
/** Room identifier = `appId:collectionName` */
type RoomId = string;
interface PeerInfo {
    peerId: PeerId;
    did: string;
    publicKey: string;
    connectedAt: number;
}
interface NetworkMessage {
    type: "sync-update" | "awareness" | "ping" | "pong";
    from: PeerId;
    payload: Uint8Array | string;
    signature?: string;
}

/** Base58-encoded Ed25519 public key */
type PublicKey = string;
/** Raw signature bytes as a hex string */
type Signature = string;
/**
 * A ZerithDB identity — a keypair derived DID.
 * The `did` field is the W3C DID Key (`did:key:z6Mk...`).
 */
interface Identity {
    /** W3C DID Key identifier — e.g. `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK` */
    did: string;
    publicKey: PublicKey;
    /** Created at Unix timestamp (ms) */
    createdAt: number;
}

interface SyncUpdate {
    collectionName: string;
    update: Uint8Array;
    origin: string | null;
}
interface SyncState {
    synced: boolean;
    pendingUpdates: number;
    connectedPeers: number;
}
interface AwarenessState {
    peerId: string;
    did: string;
    cursor?: {
        line: number;
        column: number;
    };
    [key: string]: unknown;
}

export { type AuthConfig, type AwarenessState, type CollectionName, type Document, type DocumentId, ErrorCode, EventEmitter, type FindResult, type Identity, type InsertResult, type NetworkConfig, type NetworkMessage, type PeerId, type PeerInfo, type PublicKey, type QueryFilter, type RoomId, type Signature, type SyncConfig, type SyncState, type SyncUpdate, type UpdateSpec, type ZerithDBConfig, ZerithDBError };
