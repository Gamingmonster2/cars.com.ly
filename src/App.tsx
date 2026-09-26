import React, { useState, useEffect, useCallback } from 'react';
import { Car } from './types';
import { carService } from './lib/carService';
import { useAuth } from './lib/authContext';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CarCard from './components/CarCard';
import CarForm from './components/CarForm';
import AuthModal from './components/AuthModal';
import CodeExplorer from './components/CodeExplorer';
import CarDetailPage from './components/CarDetailPage';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, CarFront, MessageCircle, Eye, ShieldCheck, Flame, UserCheck, Sparkles } from 'lucide-react';
import { CARS_DATA } from './data';

function getCarSlugFromLocation(): string | null {
  try {
    const pathname = window.location.pathname;
    if (pathname.includes('/car/')) {
      const parts = pathname.split('/car/');
      const slug = parts[1]?.split('/')[0]?.split('?')[0];
      if (slug) return decodeURIComponent(slug);
    }
    const hash = window.location.hash;
    if (hash.includes('car/')) {
      const parts = hash.split('car/');
      const slug = parts[1]?.split('/')[0]?.split('?')[0];
      if (slug) return decodeURIComponent(slug);
    }
    const params = new URLSearchParams(window.location.search);
    const carParam = params.get('car');
    if (carParam) return decodeURIComponent(carParam);
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const { currentUser, userProfile } = useAuth();
  const [cars, setCars] = useState<Car[]>(CARS_DATA);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnlyMyAds, setShowOnlyMyAds] = useState(false);
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [currentCarSlug, setCurrentCarSlug] = useState<string | null>(getCarSlugFromLocation);

  const [pageViews] = useState(() => {
    try {
      const saved = localStorage.getItem('cars_libya_views_count');
      const current = saved ? parseInt(saved, 10) : 1420;
      const next = current + Math.floor(Math.random() * 3) + 1;
      localStorage.setItem('cars_libya_views_count', next.toString());
      return next;
    } catch {
      return 1420;
    }
  });

  const [activeVisitors] = useState(() => 18 + Math.floor(Math.random() * 12));

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentCarSlug(getCarSlugFromLocation());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const loadCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carService.getAllCars();
      setCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const handleAddCar = async (carData: Omit<Car, 'id' | 'slug'>) => {
    try {
      await carService.addCar({
        ...carData,
        createdAt: Date.now(),
        timeAgo: 'الآن',
        views: 1
      });
      setShowForm(false);
      setToastMessage({ type: 'success', text: 'تم نشر إعلانك بنجاح وسيتوفر مباشرة للزوار برابط دائم!' });
      setTimeout(() => setToastMessage(null), 4000);
      await loadCars();
    } catch (error) {
      setToastMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة إعلانك. يرجى المحاولة لاحقاً.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      await carService.deleteCar(carId);
      setCars(prev => prev.filter(c => c.id !== carId));
      setToastMessage({ type: 'success', text: 'تم حذف الإعلان بنجاح من قاعدة البيانات' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      setToastMessage({ type: 'error', text: 'تعذر حذف الإعلان. تأكد من امتلاكك صلاحية الحذف.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const navigateToHome = () => {
    setCurrentCarSlug(null);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

  const myCars = cars.filter(car => {
    if (!currentUser && !userProfile) return false;
    return (
      (currentUser && car.ownerId === currentUser.uid) ||
      (userProfile && car.ownerId === userProfile.uid) ||
      (userProfile?.phone && car.whatsapp.endsWith(userProfile.phone.slice(-8)))
    );
  });

  const selectedCar = currentCarSlug 
    ? (cars.find(c => c.slug === currentCarSlug || c.id === currentCarSlug) || 
       CARS_DATA.find(c => c.slug === currentCarSlug || c.id === currentCarSlug))
    : null;

  if (selectedCar) {
    return (
      <>
        <CarDetailPage car={selectedCar} onBack={navigateToHome} />
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-3.5 rounded-2xl shadow-xl font-bold text-sm border flex items-center gap-3 backdrop-blur-md ${
                toastMessage.type === 'success' 
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' 
                  : 'bg-rose-950/90 text-rose-200 border-rose-500/30'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-current" />
              {toastMessage.text}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const displayedCars = showOnlyMyAds ? myCars : cars;
  const filteredCars = displayedCars.filter(car => 
    car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.city.includes(searchQuery) ||
    car.description.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      <Header 
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAddCar={() => setShowForm(true)}
        showOnlyMyAds={showOnlyMyAds}
        onToggleMyAds={() => setShowOnlyMyAds(prev => !prev)}
        hasMyAds={myCars.length > 0}
      />
      {/* باقي واجهة الموقع الرئيسية */}
      <CodeExplorer />
    </div>
  );
}
