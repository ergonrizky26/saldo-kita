"use client";

import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { createGoal } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function AddGoalModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const result = await createGoal(new FormData(e.currentTarget));

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
                <PlusCircle className="w-4 h-4" /> Tambah Target
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Buat Target Baru</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Apa yang ingin dicapai?</label>
                                <input name="name" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="Contoh: Beli PS5 / Dana Darurat" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Nominal (Rp)</label>
                                <input name="targetAmount" type="number" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="8000000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Selesai (Opsional)</label>
                                <input name="deadline" type="date" className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full p-4 bg-blue-600 text-white font-bold rounded-xl flex justify-center hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Impian"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}