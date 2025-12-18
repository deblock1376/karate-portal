import { auth } from '@/auth';
import { cookies } from 'next/headers';

export default async function DebugPage() {
    const session = await auth();
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    return (
        <div className="min-h-screen p-8 bg-slate-900 text-white">
            <h1 className="text-3xl font-bold mb-8">🔍 Debug Information</h1>

            <div className="space-y-6">
                {/* Environment */}
                <section className="p-6 bg-slate-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-amber-400">Environment</h2>
                    <pre className="bg-slate-900 p-4 rounded overflow-x-auto text-sm">
                        {JSON.stringify({
                            NODE_ENV: process.env.NODE_ENV,
                            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '[SET]' : '[NOT SET]',
                            COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '[NOT SET]',
                        }, null, 2)}
                    </pre>
                </section>

                {/* Session */}
                <section className="p-6 bg-slate-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-amber-400">Session</h2>
                    <pre className="bg-slate-900 p-4 rounded overflow-x-auto text-sm">
                        {session ? JSON.stringify(session, null, 2) : 'null (NOT AUTHENTICATED)'}
                    </pre>
                </section>

                {/* Cookies */}
                <section className="p-6 bg-slate-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-amber-400">Cookies</h2>
                    <div className="bg-slate-900 p-4 rounded">
                        {allCookies.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {allCookies.map((cookie) => (
                                    <li key={cookie.name} className="border-b border-slate-700 pb-2">
                                        <span className="font-mono text-green-400">{cookie.name}</span>
                                        <span className="text-slate-500 ml-2">
                                            (value: {cookie.value.substring(0, 20)}...)
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-red-400">No cookies found</p>
                        )}
                    </div>
                </section>

                {/* Expected Cookie */}
                <section className="p-6 bg-slate-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-amber-400">Expected Cookie</h2>
                    <p className="text-sm mb-2">Looking for: <code className="bg-slate-900 px-2 py-1 rounded">next-auth.session-token</code></p>
                    <p className="text-sm">
                        {allCookies.find(c => c.name.includes('session-token')) ? (
                            <span className="text-green-400">✓ Found</span>
                        ) : (
                            <span className="text-red-400">✗ Not Found</span>
                        )}
                    </p>
                </section>
            </div>

            <div className="mt-8">
                <a href="/login" className="text-amber-500 hover:text-amber-400">← Back to Login</a>
            </div>
        </div>
    );
}
