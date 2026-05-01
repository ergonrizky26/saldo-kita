import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md text-center">

                <div className="flex justify-center mb-6">
                    <div className="bg-blue-50 p-4 rounded-full">
                        <MailCheck className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">Cek Email Anda! 💌</h1>

                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Kami telah mengirimkan tautan verifikasi ke alamat email Anda.
                    Silakan klik tautan tersebut untuk mengaktifkan akun DompetKita Anda.
                </p>

                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs p-4 rounded-xl text-left mb-8">
                    <p className="font-bold mb-1">Tidak menerima email?</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Cek folder Spam atau Junk Anda.</li>
                        <li>Pastikan alamat email yang Anda masukkan benar.</li>
                    </ul>
                </div>

                <Link
                    href="/"
                    className="block w-full border border-slate-200 text-slate-600 font-bold p-3.5 rounded-xl hover:bg-slate-50 transition"
                >
                    Kembali ke Halaman Login
                </Link>

            </div>
        </div>
    );
}