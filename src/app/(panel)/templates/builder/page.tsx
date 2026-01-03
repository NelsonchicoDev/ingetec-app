'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Image as ImageIcon, Type, CheckSquare, Settings, List, Calendar, Hash, X } from 'lucide-react';
import { toast } from 'sonner';
import { Section, CustomField, FieldType } from '@/types'; // Asegúrate de importar CustomField y FieldType

const uid = () => Math.random().toString(36).substr(2, 9);

export default function TemplateBuilderPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'HEADER' | 'QUESTIONS'>('QUESTIONS'); // Pestañas

    // Estado del formulario
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // 👇 NUEVO: Campos personalizados del encabezado
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    const [sections, setSections] = useState<Section[]>([
        { id: uid(), title: 'Datos Generales', items: [] }
    ]);

    // --- ACCIONES CAMPOS PERSONALIZADOS ---
    const addCustomField = (type: FieldType) => {
        setCustomFields([...customFields, { id: uid(), label: '', type, required: true }]);
    };

    const removeCustomField = (id: string) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    const updateCustomField = (id: string, key: keyof CustomField, value: any) => {
        setCustomFields(customFields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    // --- ACCIONES SECCIONES (Igual que antes) ---
    const addSection = () => setSections([...sections, { id: uid(), title: 'Nueva Sección', items: [] }]);
    const removeSection = (id: string) => {
        if (sections.length === 1) return toast.error("Mínimo una sección");
        setSections(sections.filter(s => s.id !== id));
    };
    const updateSectionTitle = (id: string, val: string) => setSections(sections.map(s => s.id === id ? { ...s, title: val } : s));

    // --- ACCIONES ITEMS (Igual que antes) ---
    const addItem = (secId: string, type: any) => {
        setSections(sections.map(s => s.id === secId ? { ...s, items: [...s.items, { id: uid(), text: '', type }] } : s));
    };
    const removeItem = (secId: string, itemId: string) => {
        setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s));
    };
    const updateItemText = (secId: string, itemId: string, text: string) => {
        setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, text } : i) } : s));
    };

    // --- GUARDAR ---
    const handleSave = async () => {
        if (!title) return toast.error("El título es obligatorio");
        setSaving(true);

        try {
            const res = await fetch('/api/v1/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    structure: sections,
                    customFields // 👈 Enviamos los campos nuevos
                })
            });

            if (res.ok) {
                toast.success("Plantilla creada");
                router.push('/templates');
            } else {
                toast.error("Error al guardar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ArrowLeft size={18} /> Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                    <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
            </div>

            {/* Info Básica */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                <input
                    className="w-full text-2xl font-bold border-b-2 border-transparent focus:border-blue-500 outline-none placeholder-gray-300"
                    placeholder="Título de la Plantilla (Ej: Vehículos)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <input
                    className="w-full text-gray-600 border-b border-transparent focus:border-gray-300 outline-none text-sm"
                    placeholder="Descripción opcional..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('QUESTIONS')}
                    className={`pb-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'QUESTIONS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <List size={18} /> Preguntas y Secciones
                </button>
                <button
                    onClick={() => setActiveTab('HEADER')}
                    className={`pb-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HEADER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings size={18} /> Datos del Encabezado
                    {customFields.length > 0 && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{customFields.length}</span>}
                </button>
            </div>

            {/* --- CONTENIDO TAB 1: PREGUNTAS (BUILDER ORIGINAL) --- */}
            {activeTab === 'QUESTIONS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {sections.map((section, sIndex) => (
                        <div key={section.id} className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="bg-gray-200 text-gray-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold">{sIndex + 1}</span>
                                    <input
                                        className="bg-transparent font-bold text-gray-800 outline-none w-full"
                                        value={section.title}
                                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                        placeholder="Título de Sección"
                                    />
                                </div>
                                <button onClick={() => removeSection(section.id)}><Trash2 size={18} className="text-gray-400 hover:text-red-500" /></button>
                            </div>

                            <div className="p-4 space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300">
                                        <GripVertical size={16} className="text-gray-300" />
                                        <div className="text-gray-400">
                                            {item.type === 'TEXT' && <Type size={18} />}
                                            {item.type === 'PHOTO' && <ImageIcon size={18} />}
                                            {item.type === 'RATING_ABC' && <CheckSquare size={18} />}
                                        </div>
                                        <input
                                            className="flex-1 outline-none text-sm"
                                            placeholder="Pregunta..."
                                            value={item.text}
                                            onChange={(e) => updateItemText(section.id, item.id, e.target.value)}
                                        />

                                        <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{item.type}</div>
                                        <button onClick={() => removeItem(section.id, item.id)}><X size={16} className="text-gray-300 hover:text-red-500" /></button>
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => addItem(section.id, 'RATING_ABC')} className="btn-add"><CheckSquare size={14} /> Evaluación</button>
                                    <button onClick={() => addItem(section.id, 'TEXT')} className="btn-add"><Type size={14} /> Texto</button>
                                    <button onClick={() => addItem(section.id, 'PHOTO')} className="btn-add"><ImageIcon size={14} /> Foto</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 flex justify-center items-center gap-2">
                        <Plus size={20} /> Nueva Sección
                    </button>
                </div>
            )}

            {/* --- CONTENIDO TAB 2: HEADER FIELDS (NUEVO) --- */}
            {activeTab === 'HEADER' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4">
                        💡 Define aquí los datos que se pedirán al inicio (Ej: Kilometraje, Patente, Fecha Vencimiento).
                    </div>

                    <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4 space-y-4">
                        {customFields.length === 0 && (
                            <p className="text-center text-gray-400 py-8 italic">No hay campos personalizados. Agrega uno abajo.</p>
                        )}

                        {customFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>

                                {/* Icono según tipo */}
                                <div className="text-gray-500">
                                    {field.type === 'TEXT' && <Type size={18} />}
                                    {field.type === 'NUMBER' && <Hash size={18} />}
                                    {field.type === 'DATE' && <Calendar size={18} />}
                                </div>

                                <input
                                    className="flex-1 bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 text-sm py-1"
                                    placeholder="Nombre del Campo (Ej: Patente)"
                                    value={field.label}
                                    onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                                    autoFocus
                                />

                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                                    />
                                    Obligatorio
                                </label>

                                <button onClick={() => removeCustomField(field.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        <div className="flex gap-2 pt-4 border-t">
                            <button onClick={() => addCustomField('TEXT')} className="btn-add-header"><Type size={16} /> Texto</button>
                            <button onClick={() => addCustomField('NUMBER')} className="btn-add-header"><Hash size={16} /> Número</button>
                            <button onClick={() => addCustomField('DATE')} className="btn-add-header"><Calendar size={16} /> Fecha</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-add { @apply px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex gap-1 items-center border border-gray-200; }
                .btn-add-header { @apply px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 flex gap-2 items-center font-medium; }
            `}</style>
        </div>
    );
}

