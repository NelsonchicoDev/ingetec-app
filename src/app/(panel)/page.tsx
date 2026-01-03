'use client';

import { useState } from 'react';
import CompanyList from '@/components/CompanyList';
import CreateCompanyForm from '@/components/CreateCompanyForm';
import DashboardStats from '@/components/DashboardStats';
import UVWidget from '@/components/UVWidget';
import { Plus } from 'lucide-react';
import { Company } from '@/types'; // Importamos el tipo para el estado

export default function Home() {
  // Estado para refrescar la tabla
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado para mostrar/ocultar el formulario lateral
  const [showForm, setShowForm] = useState(false);

  // Estado para saber qué empresa estamos editando (si es null, estamos creando)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Se ejecuta cuando el formulario termina con éxito (Crear o Editar)
  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1); // Recarga la tabla
    setShowForm(false); // Cierra el formulario
    setEditingCompany(null); // Limpia el modo edición
  };

  // Se ejecuta cuando haces click en el lápiz en la tabla
  const handleEdit = (company: Company) => {
    setEditingCompany(company); // Guardamos la empresa a editar
    setShowForm(true); // Abrimos el panel
    // Scroll suave hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Se ejecuta cuando el usuario da click en la "X" o en cancelar
  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
          <p className="text-sm text-gray-500">Resumen general de operaciones.</p>
        </div>

        {/* Botón Principal (Nueva Empresa / Cancelar) */}
        <button
          onClick={() => {
            // Si ya está abierto, lo cerramos. Si está cerrado, lo abrimos en modo CREAR (null)
            if (showForm) {
              handleCancel();
            } else {
              setEditingCompany(null);
              setShowForm(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-white
            ${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Plus size={18} className={showForm ? 'rotate-45 transition-transform' : ''} />
          {showForm ? 'Cancelar' : 'Nueva Empresa'}
        </button>
      </header>

      {/* Tarjetas de Estadísticas */}
      <DashboardStats />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Aquí va el Widget de Radiación */}
        <UVWidget />

        {/* Puedes agregar más widgets a futuro aquí */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold uppercase mb-2">Accesos Directos</h3>
          <p className="text-sm text-gray-400">Próximamente más herramientas...</p>
        </div>

      </div>
      {/* Layout Principal: Tabla a la izquierda, Formulario a la derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Columna Izquierda (Lista) */}
        <div className="xl:col-span-2">
          <CompanyList
            refreshKey={refreshKey}
            onEdit={handleEdit} // <--- Pasamos la función de editar aquí
          />
        </div>

        {/* Columna Derecha (Formulario o Info) */}
        <div className="xl:col-span-1">
          {showForm ? (
            // Panel de Formulario (Animado)
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <CreateCompanyForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                initialData={editingCompany} // <--- Pasamos los datos para rellenar el form
              />
            </div>
          ) : (
            // Panel Informativo (Cuando no hay formulario)
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit sticky top-8">
              <h3 className="font-bold text-gray-800 mb-4">Centro de Ayuda</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Bienvenido al núcleo de PrevApp. Desde aquí puedes gestionar tus empresas cliente.
              </p>
              <ul className="text-sm text-gray-500 space-y-2 mb-4 list-disc pl-4">
                <li>Usa el botón <strong>Nueva Empresa</strong> para registrar un cliente.</li>
                <li>Usa el icono del <strong>Lápiz</strong> en la tabla para editar datos.</li>
                <li>Usa la barra de búsqueda para filtrar por RUT o Nombre.</li>
              </ul>
              <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                Ver documentación completa →
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}