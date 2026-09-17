import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Car } from '../types';

const COLLECTION_NAME = 'cars';

export const carService = {
  async getAllCars(): Promise<Car[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Car));
  },

  async addCar(car: Omit<Car, 'id'>) {
    return await addDoc(collection(db, COLLECTION_NAME), car);
  }
};
