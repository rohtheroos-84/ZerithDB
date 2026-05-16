import { EventEmitter, PeerInfo, PeerId, ZerithDBConfig } from 'zerithdb-core';
import { AuthManager } from 'zerithdb-auth';

type NetworkEvents = {
    "peer:connected": PeerInfo;
    "peer:disconnected": {
        peerId: PeerId;
    };
    message: {
        type: string;
        payload: Uint8Array | string;
        from: PeerId;
    };
    error: {
        peerId: PeerId;
        error: Error;
    };
    "transport:downgrade": {
        from: "websocket";
        to: "polling";
        reason: string;
    };
};
/**
 * Manages WebRTC peer-to-peer connections for a ZerithDB app.
 *
 * Architecture: Full mesh — every peer connects to every other peer.
 * The signaling server only handles the initial WebRTC handshake (ICE/SDP).
 * After that, all data flows peer-to-peer over encrypted WebRTC data channels.
 *
 * Supports automatic transport fallback: if WebSocket signaling is blocked
 * (e.g. by corporate firewalls), the manager transparently downgrades to
 * HTTP long-polling.
 */
declare class NetworkManager extends EventEmitter<NetworkEvents> {
    private readonly config;
    private readonly auth;
    private transport;
    private activeTransportType;
    private readonly peers;
    private readonly peerInfo;
    private localPeerId;
    private reconnectTimer;
    private reconnectAttempts;
    private disposed;
    constructor(config: ZerithDBConfig, auth: AuthManager);
    /** The transport type currently in use, or null if not connected */
    get transportType(): "websocket" | "polling" | null;
    /**
     * Connect to the signaling server and join the P2P room.
     * After connection, WebRTC handshakes happen automatically.
     *
     * Transport selection:
     * - `"auto"` (default): Try WebSocket first with a 5s timeout.
     *   If it fails, fall back to HTTP long-polling.
     * - `"websocket"`: WebSocket only.
     * - `"polling"`: HTTP long-polling only.
     */
    connect(roomId: string): Promise<void>;
    /**
     * Broadcast a message to all connected peers.
     */
    broadcast(message: {
        type: string;
        payload: string | Uint8Array;
    }): void;
    /**
     * Send a message to a specific peer.
     */
    sendTo(peerId: PeerId, message: {
        type: string;
        payload: string | Uint8Array;
    }): void;
    /** Number of currently connected peers */
    get connectedPeerCount(): number;
    /** List of all connected peer infos */
    get connectedPeers(): PeerInfo[];
    dispose(): Promise<void>;
    private connectWebSocket;
    private connectPolling;
    private attachTransport;
    /**
     * Convert a WebSocket URL to an HTTP URL.
     * `wss://host/path` → `https://host/path`
     * `ws://host/path`  → `http://host/path`
     */
    private wsUrlToHttp;
    private handleSignalingMessage;
    private createPeer;
    private scheduleReconnect;
}

/**
 * Abstraction over the transport used for signaling communication.
 * Both WebSocket and HTTP long-polling implement this interface,
 * making them interchangeable from the NetworkManager's perspective.
 */
interface SignalingTransport {
    /** Send a JSON-serialised signaling message */
    send(message: string): void;
    /** Close the transport and release resources */
    close(): void;
    /** Register a handler for incoming messages */
    onMessage(handler: (data: string) => void): void;
    /** Register a handler for transport closure */
    onClose(handler: () => void): void;
    /** Register a handler for transport errors */
    onError(handler: (err: unknown) => void): void;
    /** Whether the transport is currently connected and able to send */
    readonly connected: boolean;
}

/**
 * WebSocket-based signaling transport.
 * Extracts the existing raw WebSocket logic from NetworkManager
 * into a standalone SignalingTransport implementation.
 */
declare class WebSocketTransport implements SignalingTransport {
    private ws;
    private _connected;
    private messageHandler;
    private closeHandler;
    private errorHandler;
    get connected(): boolean;
    /**
     * Open a WebSocket connection to the signaling server.
     * Resolves when the connection is established, rejects on error or timeout.
     *
     * @param url - Full WebSocket URL including query parameters
     * @param timeoutMs - Connection timeout in milliseconds
     */
    connect(url: string, timeoutMs?: number): Promise<void>;
    send(message: string): void;
    close(): void;
    onMessage(handler: (data: string) => void): void;
    onClose(handler: () => void): void;
    onError(handler: (err: unknown) => void): void;
}

/**
 * HTTP long-polling signaling transport.
 *
 * Used as a fallback when WebSockets are blocked by corporate firewalls.
 * Implements the same SignalingTransport interface as WebSocketTransport,
 * so the NetworkManager doesn't know which transport it's using.
 *
 * Protocol:
 *   POST /poll/join   → { sessionId, peerList }
 *   GET  /poll/messages?session=<id>&room=<room>  → long-poll (30s timeout)
 *   POST /poll/send   → relay a signaling message
 */
declare class PollingTransport implements SignalingTransport {
    private readonly baseUrl;
    private _connected;
    private sessionId;
    private roomId;
    private polling;
    private abortController;
    private messageHandler;
    private closeHandler;
    private errorHandler;
    /**
     * @param baseUrl - HTTP(S) base URL of the signaling server (no trailing slash)
     */
    constructor(baseUrl: string);
    get connected(): boolean;
    /**
     * Join a room via HTTP and start the long-polling loop.
     *
     * @param roomId - Room to join
     * @param peerId - Local peer identifier
     */
    connect(roomId: string, peerId: string): Promise<void>;
    send(message: string): void;
    close(): void;
    onMessage(handler: (data: string) => void): void;
    onClose(handler: () => void): void;
    onError(handler: (err: unknown) => void): void;
    private startPolling;
    private pollLoop;
    private delay;
}

export { NetworkManager, PollingTransport, type SignalingTransport, WebSocketTransport };
