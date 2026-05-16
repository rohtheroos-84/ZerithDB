import { ZerithDBConfig } from 'zerithdb-core';
export { AuthConfig, CollectionName, Document, DocumentId, ErrorCode, Identity, InsertResult, NetworkConfig, PeerInfo, QueryFilter, SyncConfig, SyncState, UpdateSpec, ZerithDBConfig, ZerithDBError } from 'zerithdb-core';
import { CollectionClient } from 'zerithdb-db';
import { SyncEngine } from 'zerithdb-sync';
import { AuthManager } from 'zerithdb-auth';
import { NetworkManager } from 'zerithdb-network';

/**
 * The root ZerithDB application instance returned by {@link createApp}.
 */
interface ZerithDBApp {
    /**
     * Access a database collection by name.
     * The collection is created lazily on first use.
     *
     * @param name - Collection name (e.g. `"todos"`, `"messages"`)
     * @returns A typed {@link DbClient} for querying and mutating documents.
     *
     * @example
     * ```typescript
     * const todos = app.db("todos");
     * await todos.insert({ text: "Hello", done: false });
     * const all = await todos.find({});
     * ```
     */
    db<T extends Record<string, any> = Record<string, any>>(name: string): CollectionClient<T>;
    /** CRDT sync engine — manages Yjs documents and P2P update propagation */
    sync: SyncEngine;
    /** Authentication manager — keypair identity and message signing */
    auth: AuthManager;
    /** P2P network manager — WebRTC peer connections and signaling */
    network: NetworkManager;
    /** Underlying app configuration */
    config: Readonly<ZerithDBConfig>;
    /**
     * Tear down the application — close all peer connections, stop sync,
     * and release database handles.
     */
    dispose(): Promise<void>;
}
/**
 * Creates a new ZerithDB application instance.
 *
 * This is the primary entry point to the ZerithDB SDK.
 * All database, sync, auth, and network operations flow through this instance.
 *
 * @param config - Application configuration
 * @returns A configured {@link ZerithDBApp}
 *
 * @example
 * ```typescript
 * import { createApp } from "zerithdb-sdk";
 *
 * const app = createApp({
 *   appId: "my-todo-app",
 *   sync: { signalingUrl: "wss://signal.zerithdb.dev" },
 * });
 *
 * await app.db("todos").insert({ text: "Ship ZerithDB v1", done: false });
 * app.sync.enable();
 * ```
 */
declare function createApp(config: ZerithDBConfig): ZerithDBApp;

export { type ZerithDBApp, createApp };
