"use client";

import { useState } from 'react';
import { updatePassword } from '../../lib/authActions';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        const formData = new FormData(e.currentTarget);
        const result = await updatePassword(formData);

        if (result?.error) {
            setErrorMessage(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">

                <div className="flex flex-col items-center mb-8">
                    <div className="bg-green-100 p-3 rounded-2xl mb-4 text-green-600">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Buat Password Baru</h1>
                    <p className="text-slate-500 text-sm mt-1 text-center">
                        Sesi Anda telah diverifikasi. Silakan masukkan password baru yang kuat.
                    </p>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-100">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password Baru</label>
                        <input name="password" type="password" required placeholder="Minimal 6 karakter" minLength={6} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold p-3.5 rounded-xl hover:bg-green-700 transition flex justify-center items-center mt-6">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan & Masuk'}
                    </button>
                </form>

            </div>
        </div>
    );
}