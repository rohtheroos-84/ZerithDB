import * as Y from 'yjs';
import { EventEmitter, SyncState, ZerithDBConfig } from 'zerithdb-core';
import { DbClient } from 'zerithdb-db';
import { NetworkManager } from 'zerithdb-network';

type SyncEvents = {
    "state:change": SyncState;
    "update:local": {
        collectionName: string;
        update: Uint8Array;
    };
    "update:remote": {
        collectionName: string;
        update: Uint8Array;
        fromPeer: string;
    };
};
/**
 * CRDT sync engine — manages one Yjs Y.Doc per collection.
 * Local writes update the Y.Doc, which generates binary deltas sent to peers.
 * Incoming peer deltas are applied to the Y.Doc, which reactively updates the DB.
 */
declare class SyncEngine extends EventEmitter<SyncEvents> {
    private readonly config;
    private readonly db;
    private readonly network;
    private readonly docs;
    private readonly persistences;
    private _enabled;
    private _state;
    constructor(config: ZerithDBConfig, db: DbClient, network: NetworkManager);
    /**
     * Enable P2P sync. After calling this, local changes are broadcast
     * to connected peers and remote updates are applied locally.
     */
    enable(): void;
    /** Disable sync without disconnecting from peers */
    disable(): void;
    /** Current sync state snapshot */
    get state(): Readonly<SyncState>;
    /**
     * Get or create the Yjs document for a collection.
     * Documents are persisted to IndexedDB via y-indexeddb.
     */
    getDoc(collectionName: string): Y.Doc;
    /**
     * Apply a remote CRDT update to the local document.
     * Called by the network layer when a peer sends an update.
     */
    applyRemoteUpdate(collectionName: string, update: Uint8Array, fromPeer: string): void;
    dispose(): Promise<void>;
    private onPeerUpdate;
    private encodeMessage;
    private decodeMessage;
    private updateState;
}

export { SyncEngine };
