"use server";

import { createClient } from './supabase';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: "Email atau password salah." };
    }

    // Jika sukses, lempar ke dashboard
    redirect('/dashboard');
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name } // Simpan nama di metadata Supabase
        }
    });

    if (error) {
        return { error: error.message };
    }

    // Jika sukses daftar, lempar ke halaman Onboarding
    redirect('/onboarding');
}

// {FITUR VERIFIKASI EMAIL SEMENTARA ONHOLD}
// export async function signup(formData: FormData) {
//     const email = formData.get('email') as string;
//     const password = formData.get('password') as string;
//     const name = formData.get('name') as string;

//     const supabase = await createClient();
//     const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

//     const { error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//             data: { full_name: name },
//             // Pastikan link di email mengarah ke callback kita
//             emailRedirectTo: `${siteUrl}/auth/callback`
//         }
//     });

//     if (error) {
//         return { error: error.message };
//     }

//     // JANGAN ke onboarding, lempar ke halaman pemberitahuan cek email
//     redirect('/verify-email');
// }

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string;
    const supabase = await createClient();

    // Kita arahkan kembali ke route handler yang akan kita buat di Tahap 2
    // Supabase butuh tahu ke mana user harus dikembalikan setelah klik link di email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
    });

    if (error) {
        return { error: "Gagal mengirim email. Pastikan email terdaftar." };
    }

    return { success: "Tautan reset password telah dikirim! Silakan cek kotak masuk/spam Anda." };
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string;
    const supabase = await createClient();

    // Supabase otomatis tahu user mana yang sedang login berkat sesi dari route handler tadi
    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        return { error: "Gagal memperbarui password. Silakan coba minta link reset lagi." };
    }

    // Sukses ganti password? Langsung lempar ke Dashboard!
    redirect('/dashboard');
}

export async function loginWithGoogle() {
    "use server";
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. Tambahkan 'data' di samping error untuk menangkap kembalian dari Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${siteUrl}/auth/callback`,
        },
    });

    if (error) {
        return { error: "Gagal menyambung ke Google." };
    }

    // 2. Tangkap URL halaman login Google, lalu kirimkan kembali ke Browser (Client)
    if (data?.url) {
        return { url: data.url };
    }
}