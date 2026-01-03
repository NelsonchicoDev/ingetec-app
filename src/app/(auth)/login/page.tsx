'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Importante: next-auth/react para cliente
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false, // Manejamos la redirección manualmente
            });
            console.log(res);
            if (res?.error) {
                setError('Credenciales inválidas');
                setLoading(false);
            } else {
                router.push('/'); // Redirigir al Dashboard
                router.refresh();
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-900/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">PrevApp Core</h1>
                    <p className="text-gray-500 text-sm">Ingreso Seguro</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            placeholder="admin@prevapp.cl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}