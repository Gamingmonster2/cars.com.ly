import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  Search, Plus, Car as CarIcon, MessageCircle, MapPin, 
  Calendar, Gauge, CheckCircle2, X, Sparkles, Phone, AlertCircle
} from 'lucide-react';

// إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  projectId: "hotel-project-485811",
  appId: "1:693691274781:web:cc15f62ad313d881bad8f4",
  apiKey: "AIzaSyAZqYQwWRnQNkWwS6qPUBdkrexNhnURjgk",
  authDomain: "hotel-project-485811.firebaseapp.com",
  storageBucket: "hotel-project-485811.firebasestorage.app",
  messagingSenderId: "693691274781"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, "ai-studio-carslibya-f8cf7d50-bd16-44a3-8284-47deae4aef16");

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  image: string;
  whatsapp: string;
  city: string;
  description: string;
}

// سيارات أولية جاهزة للعرض
const INITIAL_CARS: Car[] = [
  {
    id: 'car-1',
    make: 'تويوتا',
    model: 'كامري LE',
    year: 2022,
    price: 78000,
    mileage: '42,000 كم',
    city: 'طرابلس',
    whatsapp: '218910000000',
    description: 'سيارة بحالة الوكالة، محرك 2.5 لتر، فتحة سقف، بصمة، شاشة وتحكم كامل في المقود.',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'car-2',
    make: 'هيونداي',
    model: 'توسان فل كامل',
    year: 2023,
    price: 92000,
    mileage: '28,000 كم',
    city: 'بنغازي',
    whatsapp: '218920000000',
    description: 'استيراد كوري، دفع رباعي، كاميرات 360، رادار ونقطة عمياء، خالية من أي صدمات.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'car-3',
    make: 'كيا',
    model: 'سبورتاج',
    year: 2021,
    price: 67000,
    mileage: '55,000 كم',
    city: 'مصراتة',
    whatsapp: '218911111111',
    description: 'محرك اقتصادي، تكييف ممتاز، حساسات خلفية، مقاعد جلد، صيانة دورية منتظمة.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
  }
];

export default function App() {
  const [cars, setCars] = useState<Car[]>(INITIAL_CARS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // حقول نموذج إضافة السيارة
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    city: 'طرابلس',
    whatsapp: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    loadCarsFromFirestore();
  }, []);

  const loadCarsFromFirestore = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'cars'), orderBy('year', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Car));
        setCars(fetched);
      }
    } catch (e) {
      console.warn('Firestore offline fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model || !formData.price || !formData.whatsapp) {
      setToast({ type: 'error', message: 'يرجى تعبئة الحقول الأساسية المطلوبة.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
    const finalWhatsapp = cleanWhatsapp.startsWith('0') ? '218' + cleanWhatsapp.slice(1) : cleanWhatsapp;

    const newCar: Omit<Car, 'id'> = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year) || 2022,
      price: Number(formData.price) || 0,
      mileage: formData.mileage.trim() || 'غير محدد',
      city: formData.city,
      whatsapp: finalWhatsapp,
      description: formData.description.trim() || 'سيارة بحالة جيدة للمعاينة والتواصل عبر الواتساب.',
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
    };

    try {
      const docRef = await addDoc(collection(db, 'cars'), newCar);
      setCars(prev => [{ ...newCar, id: docRef.id }, ...prev]);
    } catch {
      setCars(prev => [{ ...newCar, id: 'local-' + Date.now() }, ...prev]);
    }

    setShowModal(false);
    setToast({ type: 'success', message: 'تم نشر إعلان سيارتك بنجاح!' });
    setTimeout(() => setToast(null), 3500);

    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      mileage: '',
      city: 'طرابلس',
      whatsapp: '',
      description: '',
      image: ''
    });
  };

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'الكل' || car.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* التنبيه المنبثق */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border ${
          toast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-500/40' : 'bg-rose-900 text-rose-100 border-rose-500/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <CarIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">سوق سيارات ليبيا</h1>
              <span className="text-xs font-semibold text-blue-600">cars.com.ly</span>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>أضف سيارتك مجاناً</span>
          </button>
        </div>
      </header>

      {/* الواجهة الرئيسية والبحث */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* قسم العنوان والبحث */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-4 py-1.5 rounded-full text-blue-700 text-xs font-black">
            <Sparkles className="w-4 h-4" />
            <span>المنصة الأولى المباشرة لبيع وشراء السيارات في ليبيا</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
            ابحث عن سيارتك القادمة <span className="text-blue-600">بكل سهولة</span>
          </h2>
          <p className="text-slate-600 text-base">
            تصفح أحدث عروض السيارات في طرابلس، بنغازي، مصراتة وكافة المدن الليبية مع التواصل المباشر عبر الواتساب.
          </p>

          {/* شريط البحث وفلترة المدن */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالنوع أو الموديل (تويوتا، كيا، هونداي...)"
                className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm text-sm"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <option value="الكل">كل المدن</option>
              <option value="طرابلس">طرابلس</option>
              <option value="بنغازي">بنغازي</option>
              <option value="مصراتة">مصراتة</option>
              <option value="الزاوية">الزاوية</option>
              <option value="زليتن">زليتن</option>
              <option value="البيضاء">البيضاء</option>
              <option value="سبها">سبها</option>
            </select>
          </div>
        </section>

        {/* شبكة عرض السيارات */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-xl font-bold text-slate-900">
              السيارات المعروضة <span className="text-sm font-normal text-slate-500">({filteredCars.length} سيارة)</span>
            </h3>
          </div>

          {filteredCars.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <CarIcon className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-slate-600 font-bold">لا توجد سيارات مطابقة لبحثك حالياً.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCity('الكل'); }}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <div 
                  key={car.id} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img 
                      src={car.image} 
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{car.city}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-lg font-black text-slate-900">{car.make} {car.model}</h4>
                        <span className="text-lg font-black text-blue-600 whitespace-nowrap">
                          {car.price.toLocaleString()} <span className="text-xs font-bold">د.ل</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{car.year}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{car.mileage}</span>
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs mt-3 line-clamp-2 leading-relaxed">
                        {car.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <a
                        href={`https://wa.me/${car.whatsapp}?text=${encodeURIComponent(`السلام عليكم، استفسر عن سيارة ${car.make} ${car.model} موديل ${car.year} المعروضة في موقع cars.com.ly`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>تواصل واتساب</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* نافذة إضافة سيارة جديدة */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute left-6 top-6 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">إضافة إعلان سيارة جديدة</h3>
                <p className="text-xs text-slate-500">سيظهر إعلانك مباشرة لآلاف المشترين في ليبيا</p>
              </div>
            </div>

            <form onSubmit={handleSubmitCar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الماركة (الشركة) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تويوتا"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموديل (الفئة) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كامري"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سنة الصنع *</label>
                  <input
                    type="number"
                    required
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر (د.ل) *</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 55000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدينة *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="طرابلس">طرابلس</option>
                    <option value="بنغازي">بنغازي</option>
                    <option value="مصراتة">مصراتة</option>
                    <option value="الزاوية">الزاوية</option>
                    <option value="زليتن">زليتن</option>
                    <option value="البيضاء">البيضاء</option>
                    <option value="سبها">سبها</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسافة المقطوعة</label>
                  <input
                    type="text"
                    placeholder="مثال: 45,000 كم"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب للتواصل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 0912345678"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة السيارة (URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/car-image.jpg (اتركه فارغاً لصورة تلقائية)"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل ومواصفات السيارة</label>
                <textarea
                  rows={3}
                  placeholder="المحرك، الهيكل، الحالة العامة..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-base"
                >
                  نشر الإعلان الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* أسفل الصفحة */}
      <footer className="mt-20 border-t border-slate-200 py-8 text-center text-xs text-slate-500 font-semibold">
        <p>© {new Date().getFullYear()} سوق سيارات ليبيا (cars.com.ly) - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
