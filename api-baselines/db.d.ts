import { Table } from 'dexie';
import { Document, InsertResult, QueryFilter, UpdateSpec, ZerithDBConfig } from 'zerithdb-core';

/**
 * A handle to a single named collection within the ZerithDB local database.
 * All operations are async and backed by IndexedDB.
 */
declare class CollectionClient<T extends Record<string, any> = Record<string, any>> {
    private readonly table;
    private readonly collectionName;
    constructor(table: Table<Document<T>>, collectionName: string);
    /**
     * Insert a new document into the collection.
     * Automatically assigns `_id`, `_createdAt`, and `_updatedAt`.
     */
    insert(document: T): Promise<InsertResult>;
    /**
     * Insert multiple documents in a single atomic operation.
     */
    insertMany(documents: T[]): Promise<InsertResult[]>;
    /**
     * Find documents matching a filter.
     * All filter fields are ANDed together.
     *
     * @example
     * ```typescript
     * const active = await todos.find({ done: false });
     * const high = await todos.find({ priority: { $gte: 3 } });
     * ```
     */
    find(filter?: QueryFilter<T>): Promise<Document<T>[]>;
    /**
     * Find a single document by its `_id`.
     */
    findById(id: string): Promise<Document<T> | undefined>;
    /**
     * Update documents matching a filter.
     * Returns the number of updated documents.
     */
    update(filter: QueryFilter<T>, spec: UpdateSpec<T>): Promise<number>;
    /**
     * Delete documents matching a filter.
     * Returns the number of deleted documents.
     */
    delete(filter: QueryFilter<T>): Promise<number>;
    /**
     * Delete every document in the collection.
     */
    clearAll(): Promise<void>;
    /**
     * Count documents matching a filter.
     */
    count(filter?: QueryFilter<T>): Promise<number>;
    private applyUpdateSpec;
    private matchesFilter;
}
/**
 * Internal database client. Wraps Dexie and manages collection instances.
 * Use via {@link ZerithDBApp.db} — not instantiated directly.
 */
declare class DbClient {
    private readonly dexie;
    private readonly collections;
    constructor(config: ZerithDBConfig);
    collection<T extends Record<string, any>>(name: string): CollectionClient<T>;
    dispose(): Promise<void>;
}

export { CollectionClient, DbClient };
