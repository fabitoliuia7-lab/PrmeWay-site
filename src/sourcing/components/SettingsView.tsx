import React, { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Ship, 
  Layers, 
  Save, 
  Check, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { SourcingSettings } from '../types';

interface SettingsViewProps {
  settings: SourcingSettings;
  onSaveSettings: (settings: SourcingSettings) => void;
  onResetSeedData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetSeedData
}) => {
  const [formData, setFormData] = useState<SourcingSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newPort, setNewPort] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newCat, setNewCat] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddPort = () => {
    if (newPort.trim() && !formData.defaultChinesePorts.includes(newPort.trim())) {
      setFormData({
        ...formData,
        defaultChinesePorts: [...formData.defaultChinesePorts, newPort.trim()]
      });
      setNewPort('');
    }
  };

  const handleRemovePort = (port: string) => {
    setFormData({
      ...formData,
      defaultChinesePorts: formData.defaultChinesePorts.filter(p => p !== port)
    });
  };

  const handleAddDest = () => {
    if (newDest.trim() && !formData.mozambiqueDestinations.includes(newDest.trim())) {
      setFormData({
        ...formData,
        mozambiqueDestinations: [...formData.mozambiqueDestinations, newDest.trim()]
      });
      setNewDest('');
    }
  };

  const handleRemoveDest = (dest: string) => {
    setFormData({
      ...formData,
      mozambiqueDestinations: formData.mozambiqueDestinations.filter(d => d !== dest)
    });
  };

  const handleAddCat = () => {
    if (newCat.trim() && !formData.productCategories.includes(newCat.trim())) {
      setFormData({
        ...formData,
        productCategories: [...formData.productCategories, newCat.trim()]
      });
      setNewCat('');
    }
  };

  const handleRemoveCat = (cat: string) => {
    setFormData({
      ...formData,
      productCategories: formData.productCategories.filter(c => c !== cat)
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-corp-blue" size={26} />
            Configurações de Sourcing & Câmbios
          </h2>
          <p className="text-xs text-slate-500">
            Ajuste de taxas de conversão cambial, portos chineses de embarque e destinos aduaneiros em Moçambique.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-fadeIn">
            <Check size={14} /> Configurações guardadas!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Taxas de Câmbio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign size={16} className="text-emerald-600" />
            Taxas de Câmbio Base para Cálculos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxa USD ➔ MZN (Dólar para Meticais)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.exchangeRates.USD_TO_MZN}
                  onChange={e => setFormData({
                    ...formData,
                    exchangeRates: {
                      ...formData.exchangeRates,
                      USD_TO_MZN: parseFloat(e.target.value) || 64
                    }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">MT / $</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxa USD ➔ CNY (Dólar para Yuan Chinês)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.exchangeRates.USD_TO_CNY}
                  onChange={e => setFormData({
                    ...formData,
                    exchangeRates: {
                      ...formData.exchangeRates,
                      USD_TO_CNY: parseFloat(e.target.value) || 7.23
                    }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">¥ / $</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portos Chineses de Embarque */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Ship size={16} className="text-corp-blue" />
            Portos Chineses de Embarque (Origem)
          </h3>

          <div className="flex flex-wrap gap-2">
            {formData.defaultChinesePorts.map(port => (
              <span key={port} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                {port}
                <button
                  type="button"
                  onClick={() => handleRemovePort(port)}
                  className="text-slate-400 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newPort}
              onChange={e => setNewPort(e.target.value)}
              placeholder="Novo porto (ex: Xiamen, Qingdao)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={handleAddPort}
              className="px-3 py-1.5 bg-corp-blue text-white rounded-xl text-xs font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Destinos em Moçambique */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Ship size={16} className="text-corp-orange" />
            Portos e Terminais Aduaneiros em Moçambique (Destino)
          </h3>

          <div className="flex flex-wrap gap-2">
            {formData.mozambiqueDestinations.map(dest => (
              <span key={dest} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-corp-blue rounded-lg text-xs font-semibold">
                {dest}
                <button
                  type="button"
                  onClick={() => handleRemoveDest(dest)}
                  className="text-slate-400 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newDest}
              onChange={e => setNewDest(e.target.value)}
              placeholder="Novo destino (ex: Porto de Quelimane)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={handleAddDest}
              className="px-3 py-1.5 bg-corp-blue text-white rounded-xl text-xs font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Categorias de Produtos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={16} className="text-purple-600" />
            Categorias de Produtos para Sourcing
          </h3>

          <div className="flex flex-wrap gap-2">
            {formData.productCategories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-lg text-xs font-semibold">
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCat(cat)}
                  className="text-purple-400 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              placeholder="Nova categoria"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={handleAddCat}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Botão de Gravar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados de demonstração de sourcing?')) {
                onResetSeedData();
              }
            }}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <RotateCcw size={13} /> Restaurar dados de exemplo
          </button>

          <button
            type="submit"
            className="btn-modern-primary !py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} /> Guardar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};
