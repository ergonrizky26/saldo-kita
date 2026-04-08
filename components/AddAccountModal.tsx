"use client";

import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { createAccount } from '../lib/actions';

export default function AddAccountModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        const result = await createAccount(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
                <PlusCircle className="w-4 h-4" /> Tambah Akun
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Tambah Akun Baru</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Akun / Bank</label>
                                <input name="name" type="text" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="Contoh: Bank Mandiri" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Akun</label>
                                <select name="type" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="Bank">Bank</option>
                                    <option value="E-wallet">E-wallet</option>
                                    <option value="Cash">Cash (Uang Tunai)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Awal (Rp)</label>
                                <input name="balance" type="number" min="0" required defaultValue="0" className="w-full p-3 border border-slate-300 rounded-xl" placeholder="0" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Kepemilikan</label>
                                <select name="ownership" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="JOINT">Rekening Bersama (Akses Semua)</option>
                                    <option value="ME">Rekening Pribadi (Saya)</option>
                                    <option value="PARTNER">Rekening Pribadi (Partner)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">*Rekening pribadi akan disembunyikan saat partner Anda memfilter menggunakan tab namanya.</p>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Akun"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}