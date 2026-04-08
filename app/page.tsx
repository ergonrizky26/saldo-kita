import { createClient } from '../lib/supabase';
import { db } from '../db';
import { users, households } from '../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Wallet, AlertCircle } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Jika sudah login, langsung ke dashboard
  if (session) redirect('/dashboard');

  // Await searchParams before using it (Next.js 15+ requirement)
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams?.error as string;

  const authenticate = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const supabase = await createClient();

    // 1. Coba Login (Sign In) terlebih dahulu
    // PERUBAHAN: Hanya ambil error saja (tidak perlu data untuk dicek)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. Jika gagal login (kemungkinan akun belum ada), coba Daftar (Sign Up)
    if (signInError) {
      // PERUBAHAN: Gunakan variabel terpisah untuk hasil Sign Up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Auth Error:", signUpError.message);
        // Redirect kembali ke halaman ini dengan pesan error
        return redirect(`/?error=${encodeURIComponent(signUpError.message)}`);
      }

      // 3. Jika berhasil Sign Up, inisialisasi data di database kita (Drizzle)
      // PERUBAHAN: Panggil signUpData.user secara konsisten
      if (signUpData.user && signUpData.user.id) {
        const existingUser = await db.select().from(users).where(eq(users.id, signUpData.user.id));

        if (existingUser.length === 0) {
          // Buat household baru untuk user ini
          const [newHousehold] = await db.insert(households).values({}).returning();

          // Simpan profile user ke DB
          await db.insert(users).values({
            id: signUpData.user.id,
            householdId: newHousehold.id,
            name: name || "User DompetKita",
            email: signUpData.user.email!, // Email dijamin string oleh Drizzle
          });
        }
      }
    }

    // Jika semua sukses, arahkan ke dashboard
    redirect('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg"><Wallet className="text-white w-6 h-6" /></div>
          <h1 className="text-2xl font-bold text-slate-800">Saldo<span className="text-blue-600">Kita</span></h1>
        </div>

        {/* Notifikasi Error jika gagal */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form action={authenticate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Panggilan</label>
            <input name="name" type="text" className="w-full p-2 border rounded-lg" placeholder="Budi" />
            <p className="text-xs text-slate-500 mt-1">*Hanya digunakan saat pertama mendaftar</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full p-2 border rounded-lg" placeholder="budi@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input name="password" type="password" minLength={6} required className="w-full p-2 border rounded-lg" placeholder="Minimal 6 karakter" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
            Daftar / Masuk
          </button>
        </form>
      </div>
    </div>
  );
}