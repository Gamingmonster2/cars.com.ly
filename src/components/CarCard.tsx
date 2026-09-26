import React, { JSX, useState } from 'react';
import { Car } from '../types';
import { MessageCircle, MapPin, Gauge, Clock, Eye, Trash2, CheckCircle2, User, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/authContext';
import { getCarPageUrl } from '../lib/slugHelper';

interface CarCardProps {
  car: Car;
  onDelete?: (carId: string) => void;
  onSelect?: (car: Car) => void;
}

export default function CarCard({ car, onDelete, onSelect }: CarCardProps): JSX.Element {
  const { currentUser, userProfile } = useAuth();
  const [views, setViews] = useState(() => car.views || 84);
  const [deleting, setDeleting] = useState(false);
  const carUrl = getCarPageUrl(car.slug);

  const isOwner = Boolean(
    (currentUser && car.ownerId === currentUser.uid) ||
    (userProfile && car.ownerId === userProfile.uid) ||
    (userProfile?.phone && car.whatsapp.endsWith(userProfile.phone.slice(-8)))
  );

  return (
    <motion.div className="bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all">
      {/* بطاقة السيارة */}
    </motion.div>
  );
}
