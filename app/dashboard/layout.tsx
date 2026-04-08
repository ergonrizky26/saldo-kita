import React from 'react';
import BottomNav from '../../components/BottomNav'; // Sesuaikan path jika berbeda

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        // Tambahkan pb-24 (padding-bottom) agar konten paling bawah tidak tertutup oleh Bottom Nav di HP
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">

            {/* Semua konten halaman (page.tsx) akan dirender di dalam children ini */}
            {children}

            {/* BOTTOM NAV BAR (Hanya muncul di HP) */}
            <BottomNav />

        </div>
    );
}