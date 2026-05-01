"use server";

import { createClient } from './supabase';
import { db } from '../db';
import { users, households } from '../db/schema';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

// 1. Fungsi untuk Bikin Dompet Baru
export async function createNewHousehold(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Sesi tidak valid, silakan login ulang." };

    // Buat ID Dompet (Household) acak yang unik
    const newHouseholdId = crypto.randomUUID();

    try {
        // 1. BUAT DOMPET/RUMAHNYA DULU
        await db.insert(households).values({
            id: newHouseholdId,
            name: `Dompet ${user.user_metadata?.full_name || 'Utama'}`
        });

        // 2. BARU MASUKKAN USERNYA KE DALAM DOMPET TERSEBUT
        await db.insert(users).values({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || "Pengguna",
            householdId: newHouseholdId
        }).onConflictDoUpdate({
            target: users.id,
            set: { householdId: newHouseholdId }
        });

    } catch (e) {
        console.log("🔥 ERROR DATABASE ONBOARDING:", e);
        return { error: "Gagal membuat dompet. Coba lagi." };
    }

    // Sukses? Lanjut ke Dashboard!
    redirect('/dashboard');
}

// 2. Fungsi untuk Gabung Dompet Pasangan
export async function joinHousehold(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Sesi tidak valid, silakan login ulang." };

    const inviteCode = formData.get('inviteCode') as string;
    if (!inviteCode) return { error: "Kode undangan tidak boleh kosong." };

    try {
        // Simpan data user dengan ID Dompet dari pasangannya
        await db.insert(users).values({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || "Pengguna",
            householdId: inviteCode
        }).onConflictDoUpdate({
            target: users.id,
            set: { householdId: inviteCode }
        });
    } catch (e) {
        return { error: "Gagal bergabung. Pastikan kode benar." };
    }

    // Sukses? Lanjut ke Dashboard!
    redirect('/dashboard');
}