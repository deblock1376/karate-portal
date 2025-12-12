import { Belt, User, Video, DojoEvent, ContractType } from '@/types';

export let BELTS: Belt[] = [
    { id: '11th-kyu', name: '11th Kyu - Yellow', color: '#ffc107', order: 0 },
    { id: '10th-kyu', name: '10th Kyu - Orange', color: '#fd7e14', order: 1 },
    { id: '9th-kyu', name: '9th Kyu - Green', color: '#28a745', order: 2 },
    { id: '8th-kyu', name: '8th Kyu - Green-Black', color: '#1e7e34', order: 3 }, // Darker green
    { id: '7th-kyu', name: '7th Kyu - Blue', color: '#007bff', order: 4 },
    { id: '6th-kyu', name: '6th Kyu - Blue-Black', color: '#0056b3', order: 5 }, // Darker blue
    { id: '5th-kyu', name: '5th Kyu - Purple', color: '#6f42c1', order: 6 },
    { id: '4th-kyu', name: '4th Kyu - Purple-Black', color: '#5a32a3', order: 7 }, // Darker purple
    { id: '3rd-kyu', name: '3rd Kyu - Brown', color: '#795548', order: 8 },
    { id: '2nd-kyu', name: '2nd Kyu - Brown', color: '#5d4037', order: 9 }, // Darker brown
    { id: '1st-kyu', name: '1st Kyu - Brown', color: '#3e2723', order: 10 }, // Darkest brown
    { id: 'jr-black-1', name: 'Junior Black Belt - Level 1', color: '#343a40', order: 11 },
    { id: 'jr-black-2', name: 'Junior Black Belt - Level 2', color: '#343a40', order: 12 },
    { id: 'jr-black-3', name: 'Junior Black Belt - Level 3', color: '#343a40', order: 13 },
    { id: 'jr-black-4', name: 'Junior Black Belt - Level 4', color: '#343a40', order: 14 },
    { id: 'shodan', name: 'Shodan', color: '#000000', order: 15 },
    { id: 'nidan', name: 'Nidan', color: '#000000', order: 16 },
    { id: 'sandan', name: 'Sandan', color: '#000000', order: 17 },
    { id: 'yondan', name: 'Yondan', color: '#000000', order: 18 },
    { id: 'rokudan', name: 'Rokudan', color: '#000000', order: 19 },
];

export const USERS: User[] = [
    {
        id: 'sensei',
        name: 'Sensei Miyagi',
        email: 'sensei@dojo.com',
        role: 'sensei',
        currentBeltId: 'rokudan',
        password: 'password123',
    },
    {
        id: 'student1',
        name: 'Daniel LaRusso',
        email: 'daniel@dojo.com',
        role: 'student',
        currentBeltId: '11th-kyu',
        startDate: '2024-01-15',
        contractStartDate: '2024-01-15',
        contractRenewal: 'six_months',
        senseiNotes: 'Shows great promise. Needs to work on stance.',
        address: '123 Dojo Way, Karate City, KC 12345',
        signedContract: 'daniel_larusso_contract.pdf',
        password: 'password123',
    },
    {
        id: 'u3',
        name: 'Johnny Lawrence',
        email: 'johnny@cobra.kai',
        role: 'student',
        currentBeltId: '11th-kyu',
        startDate: '2024-02-01',
        contractStartDate: '2024-02-01',
        contractRenewal: 'monthly',
        senseiNotes: 'Aggressive style. Good power.',
        address: '456 Cobra St, Valley, CA 90210',
        password: 'password123',
    },
    {
        id: 'student2',
        name: 'Johnny Lawrence',
        email: 'johnny@dojo.com',
        role: 'student',
        currentBeltId: '10th-kyu',
        startDate: '2024-12-01',
        contractStartDate: '2024-12-01',
        contractRenewal: 'yearly',
        senseiNotes: 'Needs to work on discipline.',
        password: 'password123',
    },
];

export const VIDEOS: Video[] = [
    // White Belt Videos
    { id: 'v1', title: '11th Kyu: Stance Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '11th-kyu' },
    { id: 'v2', title: '11th Kyu: First Punch', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '11th-kyu' },

    // Yellow Belt Videos
    { id: 'v3', title: '10th Kyu Kata', url: 'https://www.youtube.com/embed/xyz789', beltId: '10th-kyu' },

    // Orange Belt Videos
    { id: 'v4', title: '9th Kyu: Sparring Drills', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '9th-kyu' },
];

let EVENTS: DojoEvent[] = [
    { id: 'e1', title: 'Belt Promotion Testing', date: '2025-12-15', description: 'Testing for all ranks. Please arrive 30 mins early.' },
    { id: 'e2', title: 'Holiday Dojo Party', date: '2025-12-20', description: 'Potluck party for all students and families.' },
];

// Helper functions to simulate database access
export const getBelts = () => BELTS;
export const getBeltById = (id: string) => BELTS.find(b => b.id === id);
export const getUsers = () => USERS;
export const getUserById = (id: string) => USERS.find(u => u.id === id);
export const getVideosByBelt = (beltId: string) => VIDEOS.filter(v => v.beltId === beltId);

export const updateUserBelt = (userId: string, newBeltId: string) => {
    const user = USERS.find(u => u.id === userId);
    if (user) {
        user.currentBeltId = newBeltId;
        return true;
    }
    return false;
};

export const addUser = (name: string, email: string, password?: string, startDate?: string, contractStartDate?: string, contractRenewal?: ContractType, senseiNotes?: string, address?: string, signedContract?: string) => {
    const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: 'student',
        currentBeltId: '11th-kyu',
        startDate,
        contractStartDate,
        contractRenewal,
        senseiNotes,
        address,
        signedContract,
        password: password || 'password123'
    };
    USERS.push(newUser);
    return newUser;
};

export const updateUser = (id: string, updates: Partial<User>) => {
    const userIndex = USERS.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        USERS[userIndex] = { ...USERS[userIndex], ...updates };
        return USERS[userIndex];
    }
    return null;
};

export const getEvents = () => EVENTS.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const addEvent = (title: string, date: string, description: string) => {
    const newEvent: DojoEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        date,
        description,
    };
    EVENTS.push(newEvent);
    return newEvent;
};

export const deleteEvent = (id: string) => {
    EVENTS = EVENTS.filter(e => e.id !== id);
};

export const addBelt = (name: string, color: string, order: number) => {
    const newBelt: Belt = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        color,
        order
    };
    BELTS.push(newBelt);
    BELTS.sort((a, b) => a.order - b.order);
    return newBelt;
};

export const updateBelt = (id: string, updates: Partial<Belt>) => {
    const belt = BELTS.find(b => b.id === id);
    if (belt) {
        Object.assign(belt, updates);
        BELTS.sort((a, b) => a.order - b.order);
        return belt;
    }
    return null;
};

export const deleteBelt = (id: string) => {
    // Prevent deleting if students are assigned to this belt
    const hasStudents = USERS.some(u => u.currentBeltId === id);
    if (hasStudents) {
        throw new Error('Cannot delete belt with assigned students.');
    }
    BELTS = BELTS.filter(b => b.id !== id);
};
