"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, User } from 'lucide-react';

type Member = { id: string; name: string; isMe: boolean };

export default function GlobalFilter({ members }: { members: Member[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'ALL';

    const handleFilterChange = (viewValue: string) => {
        router.push(`/dashboard${viewValue === 'ALL' ? '' : `?view=${viewValue}`}`);
    };

    const me = members.find(m => m.isMe);
    const partner = members.find(m => !m.isMe);

    if (members.length <= 1) return null;

    return (
        <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
            <button
                onClick={() => handleFilterChange('ALL')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${currentView === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <Users className="w-4 h-4" /> Gabungan
            </button>

            <button
                onClick={() => handleFilterChange(me?.id || '')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${currentView === me?.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <User className="w-4 h-4" /> Saya
            </button>

            {partner && (
                <button
                    onClick={() => handleFilterChange(partner.id)}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${currentView === partner.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <User className="w-4 h-4" /> {partner.name}
                </button>
            )}
        </div>
    );
}