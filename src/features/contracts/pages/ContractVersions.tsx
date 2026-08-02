import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContractRepository } from '../hooks/useContractRepository';
import { GeneratedContractVersion, GeneratedContract } from '../types';
import { formatDate } from '../utils/contractFormatters';
import { ArrowLeft, History, GitCompare, User, FileText, ArrowRight } from 'lucide-react';

export const ContractVersions: React.FC = () => {
  const repository = useContractRepository();
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [versions, setVersions] = useState<GeneratedContractVersion[]>([]);
  const [compareA, setCompareA] = useState<number>(1);
  const [compareB, setCompareB] = useState<number>(1);

  useEffect(() => {
    if (contractId) {
      repository.getContract(contractId).then(setContract);
      repository.listContractVersions(contractId).then((list) => {
        setVersions(list);
        if (list.length >= 2) {
          setCompareA(list[list.length - 2].version);
          setCompareB(list[list.length - 1].version);
        } else if (list.length === 1) {
          setCompareA(1);
          setCompareB(1);
        }
      });
    }
  }, [contractId]);

  if (!contract) return <div className="p-8 text-center text-stone-500">Загрузка версий...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <button
            onClick={() => navigate(`/contracts/${contract.id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад к договору
          </button>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            История версий договора
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {contract.templateName} • {contract.id}
          </p>
        </div>

        {versions.length >= 2 && (
          <button
            onClick={() => navigate(`/contracts/${contract.id}/compare?a=${compareA}&b=${compareB}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <GitCompare className="w-4 h-4" /> Сравнить редакции ({compareA} и {compareB})
          </button>
        )}
      </div>

      {/* Selector for comparison */}
      {versions.length >= 2 && (
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="font-bold text-stone-900">Выберите редакции для сравнения:</div>
          <div className="flex items-center gap-3">
            <select
              value={compareA}
              onChange={(e) => setCompareA(Number(e.target.value))}
              className="p-2 bg-white border border-stone-300 rounded-lg font-bold"
            >
              {versions.map(v => <option key={v.id} value={v.version}>Редакция №{v.version}</option>)}
            </select>
            <span className="text-stone-400 font-bold">VS</span>
            <select
              value={compareB}
              onChange={(e) => setCompareB(Number(e.target.value))}
              className="p-2 bg-white border border-stone-300 rounded-lg font-bold"
            >
              {versions.map(v => <option key={v.id} value={v.version}>Редакция №{v.version}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Version timeline */}
      <div className="space-y-4">
        {versions.map((v) => (
          <div key={v.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-stone-900 text-base">Редакция №{v.version}</span>
                {v.version === contract.currentVersion && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    Текущая
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{formatDate(v.createdAt)}</span>
            </div>

            <div className="text-xs text-stone-600 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Автор изменений: <strong>{v.createdBy}</strong></span>
            </div>

            {v.changeReason && (
              <p className="text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-stone-700 italic">
                «Причина: {v.changeReason}»
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
