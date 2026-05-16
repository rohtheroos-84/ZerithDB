import * as zerithdb_sdk from 'zerithdb-sdk';
import { ZerithDBConfig, QueryFilter, ZerithDBApp } from 'zerithdb-sdk';
import React from 'react';

interface ZerithProviderProps {
    config: ZerithDBConfig;
    children: React.ReactNode;
}
/**
 * Global provider for ZerithDB.
 * Initializes the P2P client and makes it available via hooks.
 */
declare const ZerithProvider: React.FC<ZerithProviderProps>;
/**
 * Access the underlying ZerithDB app client directly.
 */
declare const useZerith: () => ZerithDBApp;
/**
 * Reactive hook to query a collection.
 * Automatically updates when local or remote (P2P) changes occur.
 * @param collectionName The name of the collection to query
 * @param filter A MongoDB-style query filter. Must be JSON-serializable.
 */
declare function useQuery<T extends Record<string, any>>(collectionName: string, filter?: QueryFilter<T>): {
    data: T[];
    loading: boolean;
    error: Error | null;
    insert: (item: T) => Promise<zerithdb_sdk.InsertResult>;
    remove: (id: string) => Promise<number>;
};
/**
 * Hook to access and manage P2P sync state
 */
declare function useSync(): {
    state: Readonly<zerithdb_sdk.SyncState>;
    enable: () => void;
    disable: () => void;
};
/**
 * Hook to manage authentication and identity
 */
declare function useAuth(): {
    identity: zerithdb_sdk.Identity | null;
    signIn: () => Promise<zerithdb_sdk.Identity>;
    signOut: () => Promise<void>;
};

export { ZerithProvider, type ZerithProviderProps, useAuth, useQuery, useSync, useZerith };
