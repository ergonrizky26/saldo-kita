"use client";

import React, { useState, useEffect } from 'react';
import { Users, Link as LinkIcon, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { generatePairingCode, joinHousehold, getPairingStatus } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function PairingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'join' | 'generate'>('join');
    const [isLoading, setIsLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [pairingInfo, setPairingInfo] = useState<{ code: string | null, expiresAt: Date | null, memberCount: number }>({ code: null, expiresAt: null, memberCount: 1 });
    const router = useRouter();

    // Ambil status setiap kali modal dibuka
    useEffect(() => {
        if (isOpen) {
            fetchStatus();
        }
    }, [isOpen]);

    const fetchStatus = async () => {
        setStatusLoading(true);
        const data = await getPairingStatus();
        if (data) setPairingInfo({ ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null });
        setStatusLoading(false);
    };

    const handleGenerate = async () => {
        setIsLoading(true); setErrorMsg(""); setSuccessMsg("");
        const result = await generatePairingCode();
        if (result?.error) setErrorMsg(result.error);
        else {
            setSuccessMsg("Kode berhasil dibuat!");
            fetchStatus(); // Refresh info kode terbaru
        }
        setIsLoading(false);
    };

    const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true); setErrorMsg(""); setSuccessMsg("");
        const formData = new FormData(e.currentTarget);
        const result = await joinHousehold(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setSuccessMsg("Berhasil bergabung dengan Partner! Memuat ulang...");
            setTimeout(() => {
                setIsOpen(false);
                router.refresh();
            }, 1500);
        }
        setIsLoading(false);
    };

    const isExpired = pairingInfo.expiresAt ? new Date() > pairingInfo.expiresAt : false;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
                <Users className="w-4 h-4" />
                <span>Partner</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Hubungkan Partner</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {statusLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                        ) : pairingInfo.memberCount > 1 ? (
                            // TAMPILAN JIKA SUDAH BERPASANGAN (MUTUAL EXCLUSIVITY)
                            <div className="text-center py-6">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">Status: Berpasangan Aktif</h4>
                                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    Akun Anda sudah terhubung secara aman dengan partner. Seluruh pembukuan keuangan kini disinkronkan secara otomatis.
                                </p>
                            </div>
                        ) : (
                            // TAMPILAN JIKA BELUM BERPASANGAN
                            <>
                                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                                    <button onClick={() => setActiveTab('join')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${activeTab === 'join' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Masukkan Kode</button>
                                    <button onClick={() => setActiveTab('generate')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${activeTab === 'generate' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Buat Kode Baru</button>
                                </div>

                                {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4 flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{errorMsg}</div>}
                                {successMsg && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg mb-4">{successMsg}</div>}

                                {activeTab === 'join' ? (
                                    <form onSubmit={handleJoin} className="space-y-4">
                                        <p className="text-sm text-slate-600">Masukkan 6 digit kode yang dikirimkan oleh partner Anda. Pastikan kode belum lebih dari 24 jam.</p>
                                        <input name="code" type="text" maxLength={6} required className="w-full p-4 border border-slate-300 rounded-xl text-center text-2xl tracking-widest font-mono uppercase bg-slate-50" placeholder="XXXXXX" />
                                        <button type="submit" disabled={isLoading} className="w-full p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-4 h-4" />} Sambungkan
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <p className="text-sm text-slate-600">Berikan kode ini kepada partner Anda. Kode hanya dapat digunakan satu kali.</p>

                                        {pairingInfo.code ? (
                                            <div className={`p-6 rounded-2xl border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} relative`}>
                                                <div className={`text-4xl font-mono tracking-widest font-black ${isExpired ? 'text-red-400 line-through' : 'text-blue-700'}`}>{pairingInfo.code}</div>
                                                {pairingInfo.expiresAt && !isExpired && (
                                                    <div className="mt-3 text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> Kedaluwarsa pada: {pairingInfo.expiresAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                                {isExpired && (
                                                    <div className="mt-3 text-xs text-red-600 font-medium font-bold">KODE TELAH KEDALUWARSA</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 font-mono text-xl">
                                                ------
                                            </div>
                                        )}

                                        <button onClick={handleGenerate} disabled={isLoading} className="w-full p-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition flex justify-center items-center">
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (pairingInfo.code ? "Generate Ulang Kode" : "Buat Kode Sekarang")}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}