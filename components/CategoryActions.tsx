"use client";

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { deleteCategory, editCategory } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function CategoryActions({ category }: { category: { id: string, name: string } }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Hapus kategori ini?");
        if (!confirmDelete) return;

        setIsLoading(true);
        const result = await deleteCategory(category.id);
        if (result?.error) alert(result.error);
        else router.refresh();
        setIsLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append('id', category.id);

        const result = await editCategory(formData);
        if (result?.error) alert(result.error);
        else {
            setIsEditOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <>
            <div className="flex gap-1">
                <button onClick={() => setIsEditOpen(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete} disabled={isLoading} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Edit Kategori</h3>
                        <form onSubmit={handleEdit}>
                            <input name="name" defaultValue={category.name} required className="w-full p-3 border rounded-xl mb-4" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Batal</button>
                                <button type="submit" disabled={isLoading} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}