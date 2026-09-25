import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { Car } from '../types';
import { CARS_DATA } from '../data';

const COLLECTION_NAME = 'cars';

export const carService = {
  async getAllCars(): Promise<Car[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const remoteCars = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Car));
      return remoteCars.length > 0 ? remoteCars : CARS_DATA;
    } catch {
      return CARS_DATA;
    }
  },

  async addCar(car: Omit<Car, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), car);
    return docRef.id;
  },

  async deleteCar(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
