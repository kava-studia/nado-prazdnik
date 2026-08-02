import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { GeneratedContract, ContractAttachment } from '../types';
import { defaultAttachmentTemplates } from '../templates/attachmentTemplates';
import { ArrowLeft, Paperclip, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const ContractAttachments: React.FC = () => {
  const repository = useContractRepository();
  const contractService = new ContractService(repository);
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [selectedTplId, setSelectedTplId] = useState<string>(defaultAttachmentTemplates[0].id);

  useEffect(() => {
    if (contractId) loadContract();
  }, [contractId]);

  const loadContract = async () => {
    if (!contractId) return;
    const c = await repository.getContract(contractId);
    if (c) setContract(c);
  };

  const handleAddAttachment = async () => {
    if (!contract) return;
    const tpl = defaultAttachmentTemplates.find(a => a.id === selectedTplId);
    if (tpl) {
      await contractService.addAttachment(contract.id, tpl.name, tpl.category, tpl.defaultContent);
      await loadContract();
    }
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!contract) return;
    await contractService.removeAttachment(contract.id, attId);
    await loadContract();
  };

  if (!contract) return <div className="p-8 text-center text-stone-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-stone-800">
      <div className="border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate(`/contracts/${contract.id}`)}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад к договору
        </button>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Приложения к договору ({contract.attachments?.length || 0})
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {contract.templateName} • {contract.id}
        </p>
      </div>

      {/* Add new attachment block */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
        <label className="font-bold text-stone-900 text-xs">Добавить приложение из библиотеки NADO ({defaultAttachmentTemplates.length}):</label>
        <div className="flex gap-2">
          <select
            value={selectedTplId}
            onChange={(e) => setSelectedTplId(e.target.value)}
            className="flex-1 p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium outline-none"
          >
            {defaultAttachmentTemplates.map(a => (
              <option key={a.id} value={a.id}>[{a.category}] {a.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddAttachment}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </div>

      {/* Attachment List */}
      <div className="space-y-3">
        {contract.attachments && contract.attachments.length > 0 ? (
          contract.attachments.map((att, idx) => (
            <div key={att.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Приложение №{idx + 1}: {att.name}
                </div>
                <button
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 font-mono whitespace-pre-wrap border border-stone-200">
                {att.content}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-stone-400 text-xs bg-white border border-stone-200 rounded-2xl">
            К договору пока не прикреплено ни одного приложения
          </div>
        )}
      </div>
    </div>
  );
};
