"use client";

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { editAccount, deleteAccount } from '../lib/actions';
import { useRouter } from 'next/navigation';

type Account = { id: string, name: string, type: string, isActive: boolean | null };

export default function AccountActions({ account }: { account: Account }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus/menonaktifkan akun ini?");
        if (!confirmDelete) return;

        setIsLoading(true);
        const result = await deleteAccount(account.id);
        if (result?.error) alert(result.error);
        else router.refresh();
        setIsLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append('id', account.id);

        const result = await editAccount(formData);
        if (result?.error) alert(result.error);
        else {
            setIsEditOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    if (account.isActive === false) {
        return <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded">Nonaktif</span>;
    }

    return (
        <>
            <div className="flex gap-2">
                <button onClick={() => setIsEditOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} disabled={isLoading} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Edit Akun</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mb-4 text-xs text-slate-500 flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p>Untuk menjaga akurasi hitungan, saldo tidak dapat diedit di sini. Buat transaksi baru jika ingin mengoreksi saldo.</p>
                        </div>

                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Akun / Bank</label>
                                <input name="name" type="text" defaultValue={account.name} required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Akun</label>
                                <select name="type" defaultValue={account.type} required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="Bank">Bank</option>
                                    <option value="E-wallet">E-wallet</option>
                                    <option value="Cash">Cash (Uang Tunai)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Kepemilikan</label>
                                {/* Catatan: Untuk defaultValue kita default ke JOINT saja dulu agar mudah, atau biarkan pengguna memilih ulang */}
                                <select name="ownership" defaultValue="JOINT" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="JOINT">Rekening Bersama</option>
                                    <option value="ME">Milik Saya</option>
                                    <option value="PARTNER">Milik Partner</option>
                                </select>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}