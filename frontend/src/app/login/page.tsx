'use client';

import React from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-[#F4F7FA]" />}>
      <LoginForm />
    </React.Suspense>
  );
}
