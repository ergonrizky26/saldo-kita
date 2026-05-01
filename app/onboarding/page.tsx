"use client";

import { useState } from 'react';
import { createNewHousehold, joinHousehold } from '../../lib/onboardingActions';
import { Loader2, PlusCircle, Users } from 'lucide-react';

export default function OnboardingPage() {
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        const formData = new FormData(e.currentTarget);
        const result = mode === 'create' ? await createNewHousehold(formData) : await joinHousehold(formData);

        if (result?.error) {
            setErrorMessage(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Satu Langkah Lagi! 🎉</h1>
                    <p className="text-slate-500 text-sm">
                        Mari siapkan ruang kerja keuangan Anda.
                    </p>
                </div>

                {/* Tab Pilihan */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => { setMode('create'); setErrorMessage(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition ${mode === 'create' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PlusCircle className="w-4 h-4" /> Buat Baru
                    </button>
                    <button
                        onClick={() => { setMode('join'); setErrorMessage(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition ${mode === 'join' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" /> Gabung
                    </button>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-100">
                        {errorMessage}
                    </div>
                )}

                {/* Form Utama */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'create' ? (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <p className="text-sm text-blue-800 text-center font-medium">
                                Anda akan membuat Dompet Keuangan baru. Nanti Anda bisa mengundang pasangan atau keluarga untuk bergabung ke dompet ini.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kode Undangan Pasangan</label>
                            <input
                                name="inviteCode"
                                type="text"
                                required
                                placeholder="Contoh: 123e4567-e89b..."
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition font-mono text-sm"
                            />
                            <p className="text-xs text-slate-400 mt-2">Minta pasangan Anda melihat kode ini di halaman Pengaturan aplikasi mereka.</p>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold p-3.5 rounded-xl hover:bg-blue-700 transition flex justify-center items-center mt-6">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'create' ? 'Buat Dompet Sekarang' : 'Gabung Dompet')}
                    </button>
                </form>

            </div>
        </div>
    );
}