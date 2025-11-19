import { HistoryItem, Formula, Product, SavedPrescription, User } from '../types';

const DB_NAME = 'DermatologicaDB';
const DB_VERSION = 2; // Incremented version for schema change
const STORES = {
    HISTORY: 'history',
    SAVED_FORMULAS: 'savedFormulas',
    PRODUCTS: 'products',
    SETTINGS: 'settings', // For key-value pairs
    SAVED_PRESCRIPTIONS: 'savedPrescriptions',
    USERS: 'users',
};

let db: IDBDatabase;

// Promise-based wrapper for IDBRequest
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", request.error);
            reject("Error opening database");
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            if (!tempDb.objectStoreNames.contains(STORES.HISTORY)) {
                tempDb.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.SAVED_FORMULAS)) {
                tempDb.createObjectStore(STORES.SAVED_FORMULAS, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.PRODUCTS)) {
                tempDb.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.SETTINGS)) {
                tempDb.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.SAVED_PRESCRIPTIONS)) {
                tempDb.createObjectStore(STORES.SAVED_PRESCRIPTIONS, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.USERS)) {
                const userStore = tempDb.createObjectStore(STORES.USERS, { keyPath: 'id' });
                userStore.createIndex('email', 'email', { unique: true });
            }
        };
    });
};

// Generic CRUD operations
const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

const getAll = <T>(storeName: string): Promise<T[]> => {
    const store = getStore(storeName, 'readonly');
    return promisifyRequest(store.getAll());
};

const get = <T>(storeName: string, key: string): Promise<T | undefined> => {
    const store = getStore(storeName, 'readonly');
    return promisifyRequest(store.get(key));
}

const put = (storeName: string, item: any): Promise<IDBValidKey> => {
    const store = getStore(storeName, 'readwrite');
    return promisifyRequest(store.put(item));
};

const remove = (storeName: string, key: string): Promise<void> => {
    const store = getStore(storeName, 'readwrite');
    return promisifyRequest(store.delete(key));
};

const clear = (storeName: string): Promise<void> => {
    const store = getStore(storeName, 'readwrite');
    return promisifyRequest(store.clear());
};

// History functions
export const getAllHistory = () => getAll<HistoryItem>(STORES.HISTORY);
export const addHistoryItem = (item: HistoryItem) => put(STORES.HISTORY, item);
export const updateHistoryItem = (item: HistoryItem) => put(STORES.HISTORY, item);
export const clearHistory = () => clear(STORES.HISTORY);

// Saved Formulas functions
export const getAllSavedFormulas = () => getAll<Formula>(STORES.SAVED_FORMULAS);
export const saveFormula = (formula: Formula) => put(STORES.SAVED_FORMULAS, formula);
export const unsaveFormula = (formulaId: string) => remove(STORES.SAVED_FORMULAS, formulaId);
export const updateSavedFormula = (formula: Formula) => put(STORES.SAVED_FORMULAS, formula);
export const clearSavedFormulas = () => clear(STORES.SAVED_FORMULAS);

// Products functions
export const getAllProducts = () => getAll<Product>(STORES.PRODUCTS);
export const saveProduct = (product: Product) => put(STORES.PRODUCTS, product);
export const deleteProduct = (productId: string) => remove(STORES.PRODUCTS, productId);
export const clearProducts = () => clear(STORES.PRODUCTS);


// Settings functions (for backgroundImage, customIcons, etc.)
export const getSetting = async <T>(key: string): Promise<T | null> => {
    const result = await get<{ key: string, value: T }>(STORES.SETTINGS, key);
    return result ? result.value : null;
};
export const setSetting = (key: string, value: any) => put(STORES.SETTINGS, { key, value });
export const deleteSetting = (key: string) => remove(STORES.SETTINGS, key);

// Saved Prescriptions functions
export const getAllSavedPrescriptions = () => getAll<SavedPrescription>(STORES.SAVED_PRESCRIPTIONS);
export const savePrescription = (item: SavedPrescription) => put(STORES.SAVED_PRESCRIPTIONS, item);
export const deletePrescription = (id: string) => remove(STORES.SAVED_PRESCRIPTIONS, id);
export const clearSavedPrescriptions = () => clear(STORES.SAVED_PRESCRIPTIONS);

// User functions
export const addUser = (user: User) => put(STORES.USERS, user);
export const updateUser = (user: User) => put(STORES.USERS, user);
export const deleteUser = (userId: string) => remove(STORES.USERS, userId);


export const getUserByEmail = (email: string): Promise<User | undefined> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.USERS, 'readonly');
        const store = transaction.objectStore(STORES.USERS);
        const index = store.index('email');
        const request = index.get(email);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Backup & Restore
interface BackupData {
    history: HistoryItem[];
    savedFormulas: Formula[];
    products: Product[];
    settings: { key: string, value: any }[];
    savedPrescriptions: SavedPrescription[];
    users: User[];
}

export const exportAllData = async (): Promise<BackupData> => {
    await initDB();
    const transaction = db.transaction(Object.values(STORES), 'readonly');
    
    const stores = {
        history: transaction.objectStore(STORES.HISTORY).getAll(),
        savedFormulas: transaction.objectStore(STORES.SAVED_FORMULAS).getAll(),
        products: transaction.objectStore(STORES.PRODUCTS).getAll(),
        settings: transaction.objectStore(STORES.SETTINGS).getAll(),
        savedPrescriptions: transaction.objectStore(STORES.SAVED_PRESCRIPTIONS).getAll(),
        users: transaction.objectStore(STORES.USERS).getAll(),
    };

    const results = await Promise.all([
        promisifyRequest(stores.history),
        promisifyRequest(stores.savedFormulas),
        promisifyRequest(stores.products),
        promisifyRequest(stores.settings),
        promisifyRequest(stores.savedPrescriptions),
        promisifyRequest(stores.users),
    ]);

    return {
        history: results[0] as HistoryItem[],
        savedFormulas: results[1] as Formula[],
        products: results[2] as Product[],
        settings: results[3] as { key: string, value: any }[],
        savedPrescriptions: results[4] as SavedPrescription[],
        users: results[5] as User[],
    };
};

export const importAllData = async (data: BackupData): Promise<void> => {
    await initDB();
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    
    const stores = {
        history: transaction.objectStore(STORES.HISTORY),
        savedFormulas: transaction.objectStore(STORES.SAVED_FORMULAS),
        products: transaction.objectStore(STORES.PRODUCTS),
        settings: transaction.objectStore(STORES.SETTINGS),
        savedPrescriptions: transaction.objectStore(STORES.SAVED_PRESCRIPTIONS),
        users: transaction.objectStore(STORES.USERS),
    };

    // Clear all stores first
    Object.values(stores).forEach(store => store.clear());
    
    // Import new data
    data.history?.forEach(item => stores.history.put(item));
    data.savedFormulas?.forEach(item => stores.savedFormulas.put(item));
    data.products?.forEach(item => stores.products.put(item));
    data.settings?.forEach(item => stores.settings.put(item));
    data.savedPrescriptions?.forEach(item => stores.savedPrescriptions.put(item));
    data.users?.forEach(item => stores.users.put(item));

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};