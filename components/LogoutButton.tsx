"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { logoutUser } from '../lib/actions';

export default function LogoutButton() {
    return (
        <form action={logoutUser}>
            <button
                type="submit"
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full shadow-sm border border-red-100 text-sm font-medium hover:bg-red-100 transition-colors"
            >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
            </button>
        </form>
    );
}