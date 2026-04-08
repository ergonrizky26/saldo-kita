"use client";

import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { updateHouseholdName } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function EditHouseholdForm({ defaultName }: { defaultName: string | null }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        await updateHouseholdName(formData);

        setIsLoading(false);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-1 max-w-sm gap-2">
            <div className="flex-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Nama Grup / Pasangan</p>
                <input
                    name="name"
                    defaultValue={defaultName || ''}
                    placeholder="Contoh: Keluarga Budi & Ani"
                    className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="self-end bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                title="Simpan Nama"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
        </form>
    );
}