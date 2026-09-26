import React, { useState, useEffect } from 'react';
import { Car } from '../types';
import { ArrowRight, MessageCircle, Phone, MapPin, Share2, CheckCircle2, Eye, Clock, ShieldCheck, CarFront, Cpu, Sparkles, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface CarDetailPageProps {
  car: Car;
  onBack: () => void;
}

export default function CarDetailPage({ car, onBack }: CarDetailPageProps) {
  const images = car.images && car.images.length > 0 ? car.images : [car.image || '/images/cars/azera-2007-front.jpg'];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${car.make} ${car.model} ${car.year} للبيع في ليبيا - ${car.price.toLocaleString()} د.ل | سوق السيارات`;
    return () => { document.title = originalTitle; };
  }, [car]);

  const permalink = window.location.origin + `/car/${car.slug}`;
  const whatsappPhone = car.whatsapp.replace(/\D/g, '');
  const cleanPhone = car.phone || (whatsappPhone.startsWith('218') ? '0' + whatsappPhone.slice(3) : whatsappPhone);

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `السلام عليكم، أنا مهتم بسيارة ${car.make} ${car.model} موديل ${car.year} المعروضة في موقع cars.com.ly بسعر ${car.price.toLocaleString()} د.ل.\nرابط الإعلان: ${permalink}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      {/* صفحة السيارة الشاملة مع معرض الصور وزر الواتساب */}
    </div>
  );
}
