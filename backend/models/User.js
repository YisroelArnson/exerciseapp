const { getFirestore } = require('../firebase/config');

const db = getFirestore();

const User = {
  collection: 'users',

  async create(userData) {
    const userRef = db.collection(this.collection).doc(userData.uid);
    const timestamp = new Date();
    
    const user = {
      uid: userData.uid,
      email: userData.email,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await userRef.set(user);
    return user;
  }
};

module.exports = User;