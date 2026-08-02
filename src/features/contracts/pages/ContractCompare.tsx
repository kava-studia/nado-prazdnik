import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { VersionDiffItem, GeneratedContract } from '../types';
import { ContractVersionCompareTable } from '../components/ContractVersionCompareTable';
import { ArrowLeft, GitCompare } from 'lucide-react';

export const ContractCompare: React.FC = () => {
  const repository = useContractRepository();
  const contractService = new ContractService(repository);
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const versionA = Number(searchParams.get('a') || 1);
  const versionB = Number(searchParams.get('b') || 2);

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [diffs, setDiffs] = useState<VersionDiffItem[]>([]);

  useEffect(() => {
    if (contractId) {
      repository.getContract(contractId).then(setContract);
      contractService.compareVersions(contractId, versionA, versionB).then(setDiffs);
    }
  }, [contractId, versionA, versionB]);

  if (!contract) return <div className="p-8 text-center text-stone-500">Загрузка данных...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-stone-800">
      <div className="border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate(`/contracts/${contract.id}/versions`)}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад к истории версий
        </button>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Сравнение версий договора
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {contract.templateName} • {contract.id}
        </p>
      </div>

      <ContractVersionCompareTable diffs={diffs} versionNumA={versionA} versionNumB={versionB} />
    </div>
  );
};
