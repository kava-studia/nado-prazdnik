import React, { useState, useEffect } from 'react';
import {
  Building,
  Calendar,
  AlertTriangle,
  Layers,
  Trash,
  Plus,
  Compass,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  venueRepository,
  calendarRepository,
  disputeRepository
} from '../../repositories';
import { CalendarResource, AvailabilitySlot, DisputeCase } from '../../types';

export default function VenueCabinet() {
  const [spaces, setSpaces] = useState<CalendarResource[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Input states for new Space
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceCapacity, setNewSpaceCapacity] = useState<number>(100);

  // Package edit state
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgPrice, setPkgPrice] = useState(0);

  const loadData = async () => {
    try {
      const allSpaces = await venueRepository.getVenueSpaces('demo-user-id') || [];
      // Fallback for default venue spaces if empty
      if (allSpaces.length === 0) {
        setSpaces([
          { id: 'res-loft-main', ownerId: 'demo-user-id', name: 'Главный зал Loft-1', type: 'space', capacity: 150 },
          { id: 'res-loft-small', ownerId: 'demo-user-id', name: 'Малый лофт Loft-2', type: 'space', capacity: 45 }
        ]);
      } else {
        setSpaces(allSpaces);
      }

      const allSlots = await calendarRepository.getAllSlots('demo-user-id');
      setSlots(allSlots);

      const allDisputes = await disputeRepository.listDisputes('demo-user-id');
      setDisputes(allDisputes);

      const pkgs = await venueRepository.getVenuePackages('demo-c-venue-loft');
      setPackages(pkgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('demo-state-changed', loadData);
    return () => window.removeEventListener('demo-state-changed', loadData);
  }, []);

  // Add new Space (Resource)
  const handleAddSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName) return;

    const resourceId = `res-loft-${Date.now()}`;
    await venueRepository.saveVenueSpace('demo-user-id', {
      id: resourceId,
      name: newSpaceName,
      capacity: newSpaceCapacity
    });

    setNewSpaceName('');
    await loadData();
  };

  // Toggle package price edit
  const handleSavePkgPrice = async (pkgId: string) => {
    await venueRepository.saveVenuePackage('demo-c-venue-loft', {
      id: pkgId,
      price: pkgPrice
    });
    setEditingPackageId(null);
    await loadData();
  };

  // Check conflicts (Scenario 11: 2 holds/bookings on the same space and date)
  const getConflictsForSpaceAndDate = (spaceId: string, date: string) => {
    const matchedSlots = slots.filter(s => s.resourceId === spaceId && s.startAt === date);
    if (matchedSlots.length > 1) {
      return {
        hasConflict: true,
        message: `Обнаружен конфликт: ${matchedSlots.length} брони на один день!`,
        records: matchedSlots
      };
    }
    return { hasConflict: false };
  };

  // Group slots by space
  const getSlotsBySpace = (spaceId: string) => {
    return slots.filter(s => s.resourceId === spaceId);
  };

  return (
    <div className="space-y-8" id="venue-cabinet-root">
      
      {/* Visual calendar with Space Booking Grid */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[var(--gold-primary)]" />
            <h3 className="text-xl font-bold tracking-tight">Календарь залов и расписание броней</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-500 font-mono animate-pulse">
            Двойные брони подсвечиваются
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking List grouped by spaces */}
          <div className="lg:col-span-2 space-y-6">
            {spaces.map(space => {
              const spaceSlots = getSlotsBySpace(space.id);

              return (
                <div key={space.id} className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-3">
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[var(--gold-primary)]" />
                      {space.name}
                    </h4>
                    <span className="text-xs font-semibold text-[var(--text-muted)] font-mono">
                      Вместимость: {space.capacity || 100} чел
                    </span>
                  </div>

                  <div className="space-y-3">
                    {spaceSlots.length > 0 ? (
                      spaceSlots.map(slot => {
                        const conflictInfo = getConflictsForSpaceAndDate(space.id, slot.startAt);

                        return (
                          <div
                            key={slot.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${conflictInfo.hasConflict ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--border-soft)] bg-[var(--surface-primary)]'}`}
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                                {new Date(slot.startAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span className="text-xs text-[var(--text-secondary)] block">
                                {slot.notes || 'Поступившая бронь'}
                              </span>

                              {/* Overlapping hold conflict warning indicator (Scenario 11) */}
                              {conflictInfo.hasConflict && (
                                <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-2">
                                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                                  <span>Конфликт наложения дат! Требуется перенос или урегулирование</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-xs uppercase tracking-wider font-mono font-black px-2 py-0.5 rounded ${slot.status === 'booked' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {slot.status === 'booked' ? 'Подтверждено' : 'Удержание'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">Нет запланированных дат на этот зал.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Space Creator Form */}
          <div className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Добавить новое пространство</h4>
            
            <form onSubmit={handleAddSpace} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Название зала</label>
                <input
                  type="text"
                  required
                  placeholder="Например, VIP Терраса"
                  value={newSpaceName}
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-xl outline-none focus:border-[var(--gold-primary)] text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Вместимость (гостей)</label>
                <input
                  type="number"
                  required
                  value={newSpaceCapacity}
                  onChange={e => setNewSpaceCapacity(Number(e.target.value))}
                  className="w-full p-2.5 text-sm bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-xl outline-none focus:border-[var(--gold-primary)] text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[var(--gold-primary)] text-black font-extrabold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Создать площадку
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Package rental pricing config */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[var(--gold-primary)]" />
          <h3 className="text-xl font-bold">Тарифные пакеты и кейтеринг</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages && packages.map(pkg => (
            <div
              key={pkg.id}
              className="p-5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl space-y-4"
            >
              <div>
                <h4 className="font-extrabold text-sm">{pkg.name}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{pkg.description}</p>
              </div>

              <div className="flex justify-between items-center border-t border-[var(--border-soft)] pt-3">
                {editingPackageId === pkg.id ? (
                  <div className="flex gap-2 items-center w-full">
                    <input
                      type="number"
                      value={pkgPrice}
                      onChange={e => setPkgPrice(Number(e.target.value))}
                      className="p-2 w-32 bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-xl text-xs font-mono text-white"
                    />
                    <button
                      onClick={() => handleSavePkgPrice(pkg.id)}
                      className="px-3 py-2 bg-[var(--gold-primary)] text-black font-bold text-xs rounded-lg cursor-pointer hover:brightness-110"
                    >
                      Сохранить
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-xs">
                      Цена: <span className="text-base font-black text-[var(--gold-primary)]">{pkg.price.toLocaleString('ru-RU')} ₽</span> / {pkg.unit}
                    </div>
                    <button
                      onClick={() => {
                        setEditingPackageId(pkg.id);
                        setPkgPrice(pkg.price);
                      }}
                      className="text-xs text-[var(--gold-primary)] font-semibold hover:underline cursor-pointer"
                    >
                      Редактировать
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arbitration & disputes panel */}
      {disputes.length > 0 && (
        <div className="bg-[var(--surface-primary)] border border-red-500/20 rounded-3xl p-6 space-y-4 text-left shadow-sm">
          <div className="flex items-center gap-2.5 text-red-500">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <h4 className="text-lg font-bold">Спорные брони и компенсации</h4>
          </div>

          <div className="space-y-3">
            {disputes.map(dispute => (
              <div
                key={dispute.id}
                className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-red-500 font-mono block uppercase">Тип спора: {dispute.type}</span>
                  <p className="text-sm font-semibold mt-1">{dispute.reason}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">{dispute.description}</p>
                </div>

                <span className="text-xs font-bold font-mono text-red-400 bg-red-500/15 px-2.5 py-1 rounded-lg uppercase">
                  {dispute.status === 'under_review' ? 'В арбитраже' : 'Решено'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
