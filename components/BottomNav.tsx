"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ReceiptText, Tags, UserCircle } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Beranda', href: '/dashboard', icon: Home },
        { name: 'Riwayat', href: '/dashboard/transactions', icon: ReceiptText },
        { name: 'Kategori', href: '/dashboard/categories', icon: Tags },
        { name: 'Profil', href: '/dashboard/profile', icon: UserCircle },
    ];

    return (
        // md:hidden artinya komponen ini AKAN HILANG jika dibuka di Laptop/Tablet (layar menengah ke atas)
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Logika Aktif: Beranda harus cocok persis ('/dashboard'), yang lain bisa pakai startsWith
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center p-2 rounded-xl transition-colors min-w-[64px] ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className={`${isActive ? 'bg-indigo-50' : 'bg-transparent'} p-1.5 rounded-xl mb-1 transition-colors`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-100/50' : ''}`} />
                            </div>
                            <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}