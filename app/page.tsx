"use client";

import { createClient } from '../lib/supabase';
import { db } from '../db';
import { users, households } from '../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Wallet, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { login, signup, requestPasswordReset, loginWithGoogle } from '../lib/authActions';

type AuthMode = 'login' | 'register' | 'forgot';

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // type: 'error' | 'success'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(e.currentTarget);

    let result: { error?: string; success?: string } | any;
    if (mode === 'login') result = await login(formData);
    else if (mode === 'register') result = await signup(formData);
    else if (mode === 'forgot') result = await requestPasswordReset(formData);

    if (result?.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result?.success) {
      setMessage({ type: 'success', text: result.success });
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            {mode === 'forgot' ? <KeyRound className="w-8 h-8 text-white" /> : <Wallet className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">
            {mode === 'login' && 'Selamat Datang Kembali!'}
            {mode === 'register' && 'Mulai Catat Keuangan'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center px-4">
            {mode === 'login' && 'Masukkan detail akun Anda untuk melanjutkan.'}
            {mode === 'register' && 'Buat akun gratis dan kelola uang Anda lebih baik.'}
            {mode === 'forgot' && 'Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk membuat password baru.'}
          </p>
        </div>

        {/* Pesan Notifikasi (Error / Success) */}
        {message.text && (
          <div className={`p-3 rounded-xl text-sm font-medium mb-6 text-center border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            {message.text}
          </div>
        )}

        {/* Form Utama */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Panggilan</label>
              <input name="name" type="text" required placeholder="Contoh: Budi" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 transition" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email</label>
            <input name="email" type="email" required placeholder="anda@email.com" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 transition" />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setMessage({ type: '', text: '' }); }} className="text-xs font-bold text-blue-600 hover:underline">
                    Lupa password?
                  </button>
                )}
              </div>
              <input name="password" type="password" required placeholder="Minimal 6 karakter" minLength={6} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 transition" />
            </div>
          )}

          <button type="submit" disabled={isLoading || isGoogleLoading} className="w-full bg-blue-600 text-white font-bold p-3.5 rounded-xl hover:bg-blue-700 transition flex justify-center items-center mt-6">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              mode === 'login' ? 'Masuk' :
                mode === 'register' ? 'Daftar Sekarang' :
                  'Kirim Tautan Reset'
            )}
          </button>
        </form>

        {/* Tambahkan ini di bawah tombol Submit atau di atas pesan Switch Mode
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Atau masuk dengan</span></div>
        </div> */}

        {/* --- TOMBOL GOOGLE LOGIN (TAMBAHKAN INI) --- */}
        {mode !== 'forgot' && (
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Atau</span></div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsGoogleLoading(true);
                setMessage({ type: '', text: '' });
                const result = await loginWithGoogle();
                if (result?.error) {
                  setMessage({ type: 'error', text: result.error });
                  setIsGoogleLoading(false);
                } else if (result?.url) {
                  // Jika server memberikan URL Google, paksa browser pindah ke sana!
                  window.location.href = result.url;
                }
              }}
              disabled={isLoading || isGoogleLoading}
              className="w-full border border-slate-200 p-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition text-slate-700"
            >
              {/* Ubah tampilan saat sedang loading */}
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google Logo" />
              )}
              {isGoogleLoading ? 'Mengalihkan ke Google...' : 'Masuk dengan Google'}
            </button>
          </div>
        )}
        {/* ------------------------------------------- */}

        {/* Toggle Pindah Mode Bawah */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {mode === 'login' ? "Belum punya akun? " : mode === 'register' ? "Sudah punya akun? " : "Ingat password Anda? "}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage({ type: '', text: '' }); }} className="text-blue-600 font-bold hover:underline">
              {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}