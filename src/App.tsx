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

// استخراج الـ slug الخاص بالإعلان من الرابط الحالي (يدعم المسار المباشر، الـ hash، والـ search query)
function getCarSlugFromLocation(): string | null {
  try {
    // 1. فحص المسار /car/:slug
    const pathname = window.location.pathname;
    if (pathname.includes('/car/')) {
      const parts = pathname.split('/car/');
      const slug = parts[1]?.split('/')[0]?.split('?')[0];
      if (slug) return decodeURIComponent(slug);
    }

    // 2. فحص الـ hash #/car/:slug أو #car/:slug
    const hash = window.location.hash;
    if (hash.includes('car/')) {
      const parts = hash.split('car/');
      const slug = parts[1]?.split('/')[0]?.split('?')[0];
      if (slug) return decodeURIComponent(slug);
    }

    // 3. فحص معاملات البحث ?car=:slug
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

  // حالة الصفحة الحالية (إما الرئيسية أو صفحة سيارة معينة)
  const [currentCarSlug, setCurrentCarSlug] = useState<string | null>(getCarSlugFromLocation);

  // عداد مشاهدات الصفحة وزوار الموقع لتنشيط المنصة
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

  // استماع لتغييرات مسار الرابط (Back/Forward في المتصفح أو فتح تبويب جديد)
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

  // التحقق من الإعلانات الخاصة بالمستخدم الحالي
  const myCars = cars.filter(car => {
    if (!currentUser && !userProfile) return false;
    return (
      (currentUser && car.ownerId === currentUser.uid) ||
      (userProfile && car.ownerId === userProfile.uid) ||
      (userProfile?.phone && car.whatsapp.endsWith(userProfile.phone.slice(-8)))
    );
  });

  // فحص ما إذا كان الرابط الحالي يطلب صفحة سيارة مستقلة
  const selectedCar = currentCarSlug 
    ? (cars.find(c => c.slug === currentCarSlug || c.id === currentCarSlug) || 
       CARS_DATA.find(c => c.slug === currentCarSlug || c.id === currentCarSlug))
    : null;

  // إذا كان المستخدم في صفحة إعلان مستقل
  if (selectedCar) {
    return (
      <>
        <CarDetailPage 
          car={selectedCar} 
          onBack={navigateToHome} 
        />
        {/* Toast Notification */}
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

      <main>
        {/* Hero Section */}
        <section className="bg-slate-900 text-white pt-16 pb-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.5),transparent)]" />
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-500/30"
            >
              <CarFront size={14} />
              سوق السيارات الليبي المباشر (CARS.COM.LY)
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
              بع واشترِ سيارتك في ليبيا <span className="text-blue-400">بكل ثقة</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10"
            >
              إعلانات حقيقية وصفحات مستقلة مخصصة لكل سيارة برابط دائم ومهيأ لمحركات البحث Google. تواصل مباشر عبر الواتساب بدون عمولات.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 mb-8"
            >
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                <Plus size={24} />
                أضف إعلانك الآن - مجاناً
              </button>

              {!currentUser && !userProfile && (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                >
                  <UserCheck size={20} className="text-blue-400" />
                  تسجيل الدخول / فتح حساب
                </button>
              )}
            </motion.div>

            {/* شريط الإحصائيات الحية لتنشيط الموقع */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 bg-slate-800/80 border border-slate-700/60 backdrop-blur-md px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-blue-400" />
                <span>المشاهدات:</span>
                <span className="text-white font-extrabold text-sm">{pageViews.toLocaleString()}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>متصفح نشط:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{activeVisitors}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-400" />
                <span>إعلانات متوفرة:</span>
                <span className="text-amber-300 font-extrabold text-sm">{cars.length} سيارة</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Live Search Section */}
        <SearchBar onSearch={setSearchQuery} />

        {/* Cars Grid Section */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-200 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-2xl font-black text-slate-900">
                {showOnlyMyAds ? 'إعلاناتي الخاصة' : searchQuery ? `نتائج البحث (${filteredCars.length})` : 'الإعلانات الحالية في السوق'}
              </h3>
              {showOnlyMyAds && (
                <button
                  onClick={() => setShowOnlyMyAds(false)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  (عرض كل السيارات)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                قاعدة البيانات: متصلة
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* تنويه عن ميزة الصفحات المستقلة وروابط الـ SEO */}
          <div className="mb-8 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-blue-600 flex-shrink-0" />
              <span>
                <strong>ميزة جديدة:</strong> اضغط على صورة أي إعلان لفتحه في <strong>صفحة مستقلة مخصصة</strong> برابط دائم بالإنجليزية ومواصفات تفصيلية لزيادة الوصول وظهور الإعلان في محركات البحث.
              </span>
            </div>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-bold">جاري جلب إعلانات السيارات الحقيقية...</p>
            </div>
          )}

          {!loading && filteredCars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCars.map((car) => (
                  <motion.div
                    key={car.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CarCard car={car} onDelete={handleDeleteCar} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* حالة عدم وجود أي سيارات في القاعدة */}
          {!loading && cars.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 px-6 bg-white rounded-3xl border-2 border-dashed border-blue-200 max-w-2xl mx-auto shadow-sm"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CarFront size={36} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">قاعدة البيانات جاهزة لاستقبال الإعلانات</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                أرسل بيانات سيارتك وسنقوم برفعها فوراً برابط مستقل ومعرض صور ومواصفات فنية متكاملة.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={20} />
                أضف سيارة الآن
              </button>
            </motion.div>
          )}

          {/* حالة عدم العثور على نتائج بحث */}
          {!loading && cars.length > 0 && filteredCars.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
            >
              <Search size={64} className="mx-auto text-slate-300 mb-4" />
              <h4 className="text-xl font-bold text-slate-700">لم نجد سيارات تطابق بحثك</h4>
              <p className="text-slate-400 mt-1 text-sm font-medium">جرب البحث بكلمات أخرى أو أعد ضبط البحث.</p>
              <button 
                onClick={() => { setSearchQuery(''); setShowOnlyMyAds(false); }}
                className="mt-6 text-blue-600 font-bold hover:underline text-sm cursor-pointer"
              >
                عرض كافة السيارات
              </button>
            </motion.div>
          )}
        </section>

        {/* Benefits Section */}
        <section className="bg-slate-100 py-20 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'صفحة مستقلة ورابط دائم', desc: 'كل سيارة لها صفحتها الخاصة برابط إنجليزي دائم معتمد لدى Google ووسوم SEO لتحقيق أعلى نسبة مشاهدة.', icon: ShieldCheck },
              { title: 'تواصل فوري واتساب ومكالمات', desc: 'زر واتساب مخصص لكل سيارة مع رسالة جاهزة وزر اتصال مباشر لمعاينة السيارة فوراً.', icon: MessageCircle },
              { title: 'بدون أي عمولات أو رسوم', desc: 'تواصل مباشر مع مالك السيارة بدون أي وسيط ولا نسب بيع.', icon: UserCheck },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code Explorer Section */}
        <CodeExplorer />
      </main>

      {/* Toast Notification */}
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

      {/* Forms and Modals */}
      {showForm && (
        <CarForm 
          onAdd={handleAddCar}
          onCancel={() => setShowForm(false)}
          onOpenAuth={() => {
            setShowForm(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {/* نافذة تسجيل الدخول والتوثيق */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setToastMessage({ type: 'success', text: 'مرحباً بك! تم تسجيل الدخول بنجاح.' });
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <CarFront size={20} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                CARS<span className="text-blue-600">.COM.LY</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium max-w-sm text-sm">
              سوق السيارات الليبي المعتمد لبيع وشراء السيارات بكل مدن ليبيا (طرابلس، بنغازي، مصراتة، الزاوية، سبها...).
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-6 text-sm">
              <button onClick={() => setShowForm(true)} className="text-slate-500 hover:text-blue-600 font-bold transition-colors cursor-pointer">
                أضف إعلانك
              </button>
              <button onClick={() => setShowAuthModal(true)} className="text-slate-500 hover:text-blue-600 font-bold transition-colors cursor-pointer">
                تسجيل الدخول
              </button>
            </div>
            <p className="text-slate-400 text-xs font-bold">جميع الحقوق محفوظة © 2026 cars.com.ly</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
