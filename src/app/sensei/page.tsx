'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    fetchAllUsersAction,
    fetchBeltsAction,
    fetchEventsAction,
    addUserAction,
    updateUserAction,
    updateUserBeltAction,
    addEventAction,
    deleteEventAction,
    addBeltAction,
    deleteBeltAction
} from '@/app/actions';
import { User, Belt, ContractType, DojoEvent } from '@/types';
import AttendanceCheckIn from '@/components/AttendanceCheckIn';

export default function SenseiDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<User[]>([]);
    const [belts, setBelts] = useState<Belt[]>([]);
    const [events, setEvents] = useState<DojoEvent[]>([]);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBelt, setFilterBelt] = useState('all');

    // Student Form State
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [startDate, setStartDate] = useState('');
    const [contractStartDate, setContractStartDate] = useState('');
    const [contract, setContract] = useState<ContractType>('monthly');
    const [notes, setNotes] = useState('');
    const [address, setAddress] = useState('');
    const [contractFile, setContractFile] = useState<string>('');

    // Event Form State
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDescription, setEventDescription] = useState('');

    // Belt Form State
    const [beltName, setBeltName] = useState('');
    const [beltColor, setBeltColor] = useState('#000000');
    const [beltOrder, setBeltOrder] = useState(0);

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showBeltForm, setShowBeltForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        const [loadedStudents, loadedBelts, loadedEvents] = await Promise.all([
            fetchAllUsersAction(searchQuery, filterBelt),
            fetchBeltsAction(),
            fetchEventsAction()
        ]);

        // Map Prisma users to App users (fix types)
        const mappedStudents: User[] = loadedStudents.map(s => ({
            ...s,
            name: s.name || '',
            email: s.email || '',
            role: s.role as any,
            password: s.password || undefined,
            startDate: s.startDate?.toISOString(),
            contractStartDate: s.contractStartDate?.toISOString(),
            contractRenewal: (s.contractRenewal as any) || undefined,
            senseiNotes: s.senseiNotes || undefined,
            address: s.address || undefined,
            signedContract: s.signedContract || undefined,
        }));

        setStudents(mappedStudents);
        setBelts(loadedBelts);
        setEvents(loadedEvents.map(e => ({ ...e, date: e.date.toISOString() })));
        if (loadedBelts.length > 0) setBeltOrder(loadedBelts.length);
    }, [searchQuery, filterBelt]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'sensei') {
                router.push('/login');
            } else {
                loadData();
            }
        }
    }, [user, isLoading, router, loadData]);

    const handleBeltChange = async (studentId: string, newBeltId: string) => {
        await updateUserBeltAction(studentId, newBeltId);
        loadData();
    };

    const resetForm = () => {
        setStudentName('');
        setStudentEmail('');
        setStartDate('');
        setContractStartDate('');
        setContract('monthly');
        setNotes('');
        setAddress('');
        setContractFile('');
        setEditingId(null);
        setShowForm(false);
    };

    const handleEditClick = (student: User) => {
        setStudentName(student.name);
        setStudentEmail(student.email);
        setStartDate(student.startDate ? student.startDate.split('T')[0] : '');
        setContractStartDate(student.contractStartDate ? student.contractStartDate.split('T')[0] : '');
        setContract(student.contractRenewal || 'monthly');
        setNotes(student.senseiNotes || '');
        setAddress(student.address || '');
        setContractFile(student.signedContract || '');
        setEditingId(student.id);
        setShowForm(true);
        setShowEventForm(false);
        setShowBeltForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (studentName && studentEmail) {
            const data = {
                name: studentName,
                email: studentEmail,
                startDate: startDate ? new Date(startDate) : undefined,
                contractStartDate: contractStartDate || undefined, // String is fine for now if storing as string in DB but typically Date
                contractRenewal: contract,
                senseiNotes: notes,
                address: address,
                signedContract: contractFile
            };

            if (editingId) {
                await updateUserAction(editingId, data);
            } else {
                await addUserAction(data);
            }

            loadData();
            resetForm();
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (eventTitle && eventDate && eventDescription) {
            await addEventAction(eventTitle, eventDate, eventDescription);
            loadData();
            setEventTitle('');
            setEventDate('');
            setEventDescription('');
            setShowEventForm(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEventAction(id);
            loadData();
        }
    };

    const handleAddBelt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (beltName && beltColor) {
            await addBeltAction(beltName, beltColor, Number(beltOrder));
            loadData();
            setBeltName('');
            setBeltColor('#000000');
            setShowBeltForm(false);
        }
    };

    const handleDeleteBelt = async (id: string) => {
        try {
            if (confirm('Are you sure you want to delete this belt?')) {
                await deleteBeltAction(id);
                loadData();
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const calculateRenewalDate = (startDate: string, contractType: ContractType) => {
        const date = new Date(startDate);
        switch (contractType) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'six_months':
                date.setMonth(date.getMonth() + 6);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date;
    };

    const getDaysUntilRenewal = (renewalDate: Date) => {
        const today = new Date();
        const diffTime = renewalDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const upcomingRenewals = students
        .filter(s => s.contractStartDate && s.contractRenewal)
        .map(s => {
            const renewalDate = calculateRenewalDate(s.contractStartDate!, s.contractRenewal!);
            const daysUntil = getDaysUntilRenewal(renewalDate);
            return { ...s, renewalDate, daysUntil };
        })
        .filter(s => s.daysUntil <= 30 && s.daysUntil >= 0) // Show renewals within 30 days
        .sort((a, b) => a.daysUntil - b.daysUntil);

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-yellow-500">Sensei Dashboard</h1>
                    <p className="text-gray-400">Manage your dojo</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => {
                            setShowBeltForm(!showBeltForm);
                            setShowEventForm(false);
                            setShowForm(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                    >
                        {showBeltForm ? 'Cancel Belt' : 'Manage Belts'}
                    </button>
                    <button
                        onClick={() => {
                            setShowEventForm(!showEventForm);
                            setShowBeltForm(false);
                            setShowForm(false);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                    >
                        {showEventForm ? 'Cancel Event' : 'Add Event'}
                    </button>
                    <button
                        onClick={() => {
                            if (showForm) resetForm();
                            else {
                                setShowForm(true);
                                setShowEventForm(false);
                                setShowBeltForm(false);
                            }
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors"
                    >
                        {showForm ? 'Cancel Student' : 'Add Student'}
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Attendance Check In */}
            <section className="mb-8">
                <AttendanceCheckIn students={students} />
            </section>

            {/* Renewal Alert Section */}
            {upcomingRenewals.length > 0 && (
                <section className="mb-8 bg-red-900/20 border border-red-500/30 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approaching Contract Renewals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingRenewals.map(student => (
                            <div key={student.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-white">{student.name}</div>
                                    <div className="text-sm text-gray-400">{student.email}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-red-400 font-bold">{student.daysUntil} days</div>
                                    <div className="text-xs text-gray-500">
                                        Due: {student.renewalDate.toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Search and Filters */}
            <section className="mb-8 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Search Students</label>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Filter by Belt</label>
                        <select
                            value={filterBelt}
                            onChange={(e) => setFilterBelt(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        >
                            <option value="all">All Belts</option>
                            {belts.map(belt => (
                                <option key={belt.id} value={belt.id}>{belt.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* ... Forms (Belt, Event, Student) ... */}
            {showBeltForm && (
                <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Manage Belts</h2>

                    <div className="mb-8">
                        <h3 className="text-lg font-medium text-gray-300 mb-4">Add New Belt</h3>
                        <form onSubmit={handleAddBelt} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Belt Name</label>
                                <input
                                    type="text"
                                    value={beltName}
                                    onChange={(e) => setBeltName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Green"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={beltColor}
                                        onChange={(e) => setBeltColor(e.target.value)}
                                        className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={beltColor}
                                        onChange={(e) => setBeltColor(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
                                <input
                                    type="number"
                                    value={beltOrder}
                                    onChange={(e) => setBeltOrder(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors h-10"
                            >
                                Add Belt
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-4">Existing Belts</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {belts.map((belt) => (
                                <div key={belt.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-500"
                                            style={{ backgroundColor: belt.color }}
                                        ></div>
                                        <span className="font-medium">{belt.name}</span>
                                        <span className="text-xs text-gray-400">#{belt.order}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBelt(belt.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete Belt"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            {showEventForm && (
                <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Add New Event</h2>
                    <form onSubmit={handleAddEvent} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={3}
                                required
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                            >
                                Post Event
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {showForm && (
                <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                        {editingId ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Contract Start</label>
                                <input
                                    type="date"
                                    value={contractStartDate}
                                    onChange={(e) => setContractStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Contract Renewal</label>
                                <select
                                    value={contract}
                                    onChange={(e) => setContract(e.target.value as ContractType)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="six_months">Six Months</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="123 Dojo Way, Karate City"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Signed Contract</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setContractFile(e.target.files[0].name);
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-yellow-600 file:text-white
                      hover:file:bg-yellow-700
                    "
                                    />
                                    {contractFile && (
                                        <span className="text-sm text-green-400 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {contractFile}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                rows={3}
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                            >
                                {editingId ? 'Update Student' : 'Save Student'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-6">Student Roster</h2>
                    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4 text-sm font-medium text-gray-300">Name</th>
                                    <th className="p-4 text-sm font-medium text-gray-300">Email</th>
                                    <th className="p-4 text-sm font-medium text-gray-300">Rank</th>
                                    <th className="p-4 text-sm font-medium text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-750">
                                        <td className="p-4 font-medium">
                                            <div>{student.name}</div>
                                            {student.address && (
                                                <div className="text-xs text-gray-400 mt-0.5">{student.address}</div>
                                            )}
                                            {student.senseiNotes && (
                                                <div className="text-xs text-gray-500 mt-1 italic">{student.senseiNotes}</div>
                                            )}
                                            {student.signedContract && (
                                                <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                    Contract Signed
                                                </div>
                                            )}
                                            {student.contractStartDate && (
                                                <div className="text-xs text-blue-400 mt-1">
                                                    Contract Start: {student.contractStartDate.split('T')[0]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-400">{student.email}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white border border-gray-600">
                                                {belts.find(b => b.id === student.currentBeltId)?.name} Belt
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2 flex-col sm:flex-row">
                                            <button
                                                onClick={() => handleEditClick(student)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <select
                                                value={student.currentBeltId}
                                                onChange={(e) => handleBeltChange(student.id, e.target.value)}
                                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-1"
                                            >
                                                {belts.map((belt) => (
                                                    <option key={belt.id} value={belt.id}>
                                                        Promote to {belt.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {students.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No students found via search/filter.
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-6">Upcoming Events</h2>
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-purple-400">{event.title}</h3>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                        title="Delete Event"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <p className="text-gray-300 text-sm">{event.description}</p>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-500">
                                No upcoming events.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
