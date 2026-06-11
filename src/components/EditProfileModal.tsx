'use client';

import { useEffect, useState } from 'react';
import { fetchStudentContactAction, updateStudentContactAction } from '@/app/actions';

interface Props {
    onClose: () => void;
}

export default function EditProfileModal({ onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [birthday, setBirthday] = useState('');
    const [school, setSchool] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [guardianEmail, setGuardianEmail] = useState('');
    const [secondaryName, setSecondaryName] = useState('');
    const [secondaryPhone, setSecondaryPhone] = useState('');
    const [secondaryEmail, setSecondaryEmail] = useState('');

    useEffect(() => {
        fetchStudentContactAction().then(data => {
            if (data) {
                setName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setBirthday(data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '');
                setSchool(data.school || '');
                setGuardianName(data.guardianName || '');
                setGuardianPhone(data.guardianPhone || '');
                setGuardianEmail(data.guardianEmail || '');
                setSecondaryName(data.secondaryName || '');
                setSecondaryPhone(data.secondaryPhone || '');
                setSecondaryEmail(data.secondaryEmail || '');
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            await updateStudentContactAction({
                name, email, phone, address,
                birthday: birthday || undefined,
                school, guardianName, guardianPhone, guardianEmail,
                secondaryName, secondaryPhone, secondaryEmail,
            });
            setStatus('saved');
            setTimeout(() => { setStatus('idle'); onClose(); }, 1200);
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 py-12">Loading...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                        {/* Personal */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Personal Info</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Birthday</label>
                                    <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Address</label>
                                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, ST 00000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">School</label>
                                    <input value={school} onChange={e => setSchool(e.target.value)} placeholder="Lincoln Elementary" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {/* Guardian */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Parent / Guardian</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Name</label>
                                    <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Jane Smith" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                                    <input type="tel" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Email</label>
                                    <input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {/* Secondary */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Secondary Contact</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Name</label>
                                    <input value={secondaryName} onChange={e => setSecondaryName(e.target.value)} placeholder="John Smith" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                                    <input type="tel" value={secondaryPhone} onChange={e => setSecondaryPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Email</label>
                                    <input type="email" value={secondaryEmail} onChange={e => setSecondaryEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${
                            status === 'saved' ? 'bg-green-500 text-white' :
                            status === 'error' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 hover:bg-yellow-400 text-gray-950'
                        }`}
                    >
                        {saving ? 'Saving...' : status === 'saved' ? 'Saved!' : status === 'error' ? 'Error — Try Again' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
