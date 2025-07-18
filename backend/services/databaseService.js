const { getFirestore } = require('../firebase/config');

class DatabaseService {
    constructor() {
        this.db = getFirestore();
    }

    /**
     * Create a new document
     */
    async create(collection, data, docId = null) {
        try {
            const docRef = docId
                ? this.db.collection(collection).doc(docId)
                : this.db.collection(collection).doc();

            const timestamp = new Date();
            const documentData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await docRef.set(documentData);

            return {
                id: docRef.id,
                ...documentData
            };
        } catch (error) {
            console.error(`Error creating document in ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Get a document by ID
     */
    async getById(collection, docId) {
        try {
            const docRef = this.db.collection(collection).doc(docId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error(`Error getting document ${docId} from ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Update a document
     */
    async update(collection, docId, data) {
        try {
            const docRef = this.db.collection(collection).doc(docId);

            const updateData = {
                ...data,
                updatedAt: new Date()
            };

            await docRef.update(updateData);

            return await this.getById(collection, docId);
        } catch (error) {
            console.error(`Error updating document ${docId} in ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Delete a document
     */
    async delete(collection, docId) {
        try {
            await this.db.collection(collection).doc(docId).delete();
            return true;
        } catch (error) {
            console.error(`Error deleting document ${docId} from ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Get all documents from a collection with optional filters
     */
    async getAll(collection, filters = {}) {
        try {
            let query = this.db.collection(collection);

            // Apply filters
            Object.entries(filters).forEach(([field, value]) => {
                if (value !== undefined) {
                    query = query.where(field, '==', value);
                }
            });

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error getting documents from ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Get documents with pagination
     */
    async getPaginated(collection, { limit = 10, startAfter = null, orderBy = 'createdAt', direction = 'desc' } = {}) {
        try {
            let query = this.db.collection(collection)
                .orderBy(orderBy, direction)
                .limit(limit);

            if (startAfter) {
                const startAfterDoc = await this.db.collection(collection).doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }

            const snapshot = await query.get();

            return {
                documents: snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })),
                hasMore: snapshot.docs.length === limit,
                lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
            };
        } catch (error) {
            console.error(`Error getting paginated documents from ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Get documents by user ID
     */
    async getByUserId(collection, userId, options = {}) {
        try {
            let query = this.db.collection(collection).where('userId', '==', userId);

            const { orderBy = 'createdAt', direction = 'desc', limit } = options;
            query = query.orderBy(orderBy, direction);

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error getting user documents from ${collection}:`, error);
            throw error;
        }
    }

    /**
     * Search documents by text (requires proper indexing)
     */
    async search(collection, field, searchTerm) {
        try {
            const query = this.db.collection(collection)
                .where(field, '>=', searchTerm)
                .where(field, '<=', searchTerm + '\uf8ff');

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error searching documents in ${collection}:`, error);
            throw error;
        }
    }
}

module.exports = new DatabaseService(); 