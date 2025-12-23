// offline-db.js - IndexedDB wrapper for offline support
const DB_NAME = 'CashierPOS_Offline';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Online - initiating sync...');
      this.syncToFirebase();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Offline mode activated');
    });
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          salesStore.createIndex('transactionId', 'transactionId', { unique: true });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
          salesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Products operations
  async saveProduct(product) {
    const tx = this.db.transaction(['products'], 'readwrite');
    const store = tx.objectStore('products');
    await store.put(product);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveProducts(products) {
    const tx = this.db.transaction(['products'], 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      store.put(product);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getProduct(id) {
    const tx = this.db.transaction(['products'], 'readonly');
    const store = tx.objectStore('products');
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProducts() {
    const tx = this.db.transaction(['products'], 'readonly');
    const store = tx.objectStore('products');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query) {
    const products = await this.getAllProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm))
    );
  }

  // Sales operations
  async saveSale(sale) {
    // Mark as unsynced if offline
    sale.synced = this.isOnline ? true : false;
    sale.offlineCreated = !this.isOnline;
    sale.localTimestamp = new Date().toISOString();
    
    const tx = this.db.transaction(['sales'], 'readwrite');
    const store = tx.objectStore('sales');
    const request = store.add(sale);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const saleId = request.result;
        resolve(saleId);
        
        // Add to sync queue if offline
        if (!this.isOnline) {
          this.addToSyncQueue('sale', saleId, sale);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSales() {
    const tx = this.db.transaction(['sales'], 'readonly');
    const store = tx.objectStore('sales');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedSales() {
    const sales = await this.getAllSales();
    return sales.filter(s => !s.synced);
  }

  async markSaleSynced(id) {
    const tx = this.db.transaction(['sales'], 'readwrite');
    const store = tx.objectStore('sales');
    const sale = await this.getSale(id);
    
    if (sale) {
      sale.synced = true;
      sale.syncedAt = new Date().toISOString();
      await store.put(sale);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSale(id) {
    const tx = this.db.transaction(['sales'], 'readonly');
    const store = tx.objectStore('sales');
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(type, entityId, data) {
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    
    const queueItem = {
      type,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    await store.add(queueItem);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSyncQueue() {
    const tx = this.db.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue() {
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    await store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async removeSyncQueueItem(id) {
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    await store.delete(id);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Sync to Firebase
  async syncToFirebase() {
    if (!this.isOnline) {
      console.log('Still offline, cannot sync');
      return;
    }

    try {
      const unsyncedSales = await this.getUnsyncedSales();
      console.log(`Syncing ${unsyncedSales.length} sales to Firebase...`);

      for (const sale of unsyncedSales) {
        try {
          // This will be called from app.js with Firebase instance
          if (window.syncSaleToFirebase) {
            await window.syncSaleToFirebase(sale);
            await this.markSaleSynced(sale.id);
            console.log(`Synced sale ${sale.transactionId}`);
          }
        } catch (error) {
          console.error(`Failed to sync sale ${sale.transactionId}:`, error);
        }
      }

      console.log('Sync complete!');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Update product stock locally
  async updateProductStock(productId, quantityChange) {
    const product = await this.getProduct(productId);
    if (product) {
      product.stock += quantityChange;
      await this.saveProduct(product);
    }
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
