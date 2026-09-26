import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { X, Mail, Phone, Lock, User, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess }: any) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginWithPhoneWhatsApp } = useAuth();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      {/* نافذة الدخول */}
    </div>
  );
}
