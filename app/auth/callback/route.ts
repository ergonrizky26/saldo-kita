import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase';
import { db } from '../../../db'; // Sesuaikan path import DB Anda
import { users } from '../../../db/schema'; // Sesuaikan path import Schema Anda
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next'); // Biasanya diisi /update-password

    if (code) {
        const supabase = await createClient();

        // Tukarkan kode dengan Sesi Login
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // 1. Jika ada tujuan khusus (seperti dari email Lupa Password)
            if (next) {
                return NextResponse.redirect(`${origin}${next}`);
            }

            // 2. Jika ini login biasa (Google), cek apakah dia sudah punya Dompet
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Cari user ini di database Drizzle kita
                const dbUser = await db.select().from(users).where(eq(users.id, user.id));
                const hasHousehold = dbUser[0]?.householdId;

                // Jika sudah punya dompet, silakan masuk ke Dashboard
                if (hasHousehold) {
                    return NextResponse.redirect(`${origin}/dashboard`);
                }
                // Jika belum (user Google baru), wajib ikut Onboarding dulu!
                else {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }
            }
        }
    }

    // Jika gagal/kodenya salah
    return NextResponse.redirect(`${origin}/?error=invalid_token`);
}