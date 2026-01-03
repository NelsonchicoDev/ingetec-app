'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    onSearch: (value: string) => void;
}

export default function SearchInput({ onSearch }: Props) {
    const [text, setText] = useState('');

    // Efecto Debounce: Espera 500ms después de que dejas de escribir
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(text);
        }, 500);

        return () => clearTimeout(timer);
    }, [text, onSearch]);

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Buscar por nombre o RUT..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}