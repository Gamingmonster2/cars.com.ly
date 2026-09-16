import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'cars';

export const carService = {
  async getAllCars() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },
  async addCar(car) {
    return await addDoc(collection(db, COLLECTION_NAME), car);
  }
};
