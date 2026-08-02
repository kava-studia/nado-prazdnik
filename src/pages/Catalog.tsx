import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Filter, Calendar as CalendarIcon, SlidersHorizontal, RefreshCw, Send, CheckCircle } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import ContractorCard from '../components/ContractorCard';
import { 
  EmptyState, 
  BottomSheet, 
  FormField, 
  PrimaryButton, 
  SecondaryButton 
} from '../components/UI';
import { useRepositories } from '../repositories/RepositoryProvider';
import { allContractorFixtures } from '../demo/fixtures/contractors';
import { ContractorProfile } from '../types';

const categoryNameMap: Record<string, string> = {
  venues: 'Площадки',
  venue: 'Площадки',
  hosts: 'Ведущие',
  host: 'Ведущие',
  djs: 'Диджеи',
  dj: 'Диджеи',
  photographers: 'Фотографы',
  photographer: 'Фотографы',
  videographers: 'Видеографы',
  videographer: 'Видеографы',
  decorators: 'Декораторы',
  decorator: 'Декораторы',
  artists: 'Артисты',
  artist: 'Артисты',
  catering: 'Кейтеринг',
  equipment: 'Звук и свет',
  transport: 'Транспорт',
  coordinators: 'Координаторы',
};

const categoryPluralMap: Record<string, string> = {
  venue: 'venues',
  venues: 'venues',
  organizer: 'organizers',
  organizers: 'organizers',
  coordinator: 'coordinators',
  coordinators: 'coordinators',
  host: 'hosts',
  hosts: 'hosts',
  dj: 'djs',
  djs: 'djs',
  photographer: 'photographers',
  photographers: 'photographers',
  videographer: 'videographers',
  videographers: 'videographers',
  decorator: 'decorators',
  decorators: 'decorators',
  artists: 'artists',
  artist: 'artists',
  catering: 'catering',
  equipment: 'equipment',
  transport: 'transport',
};

export default function Catalog() {
  const { category: rawCategory = 'djs' } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { contractorsRepository } = useRepositories();

  const categoryKey = categoryPluralMap[rawCategory] || rawCategory;
  const singularCat = rawCategory.replace(/s$/, '');

  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    contractorsRepository.getContractors().then(list => {
      if (!isMounted) return;
      if (list && list.length > 0) {
        setContractors(list);
      } else {
        setContractors(allContractorFixtures);
      }
    }).catch(() => {
      if (isMounted) setContractors(allContractorFixtures);
    });
    return () => { isMounted = false; };
  }, [contractorsRepository]);

  const filteredContractors = React.useMemo(() => {
    return contractors.filter(c => {
      const matchCat = c.category === categoryKey || c.category === singularCat || c.category === rawCategory;
      const matchCity = selectedCity === 'all' || c.city === selectedCity;
      const price = c.startingPrice || c.price || 0;
      const matchPrice = price <= maxPrice;
      return matchCat && matchCity && matchPrice;
    });
  }, [contractors, categoryKey, singularCat, rawCategory, selectedCity, maxPrice]);

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">Каталог Профессионалов</span>
            <h1 className="text-2xl font-black">{categoryNameMap[rawCategory] || 'Каталог'}</h1>
          </div>
          
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl text-xs font-bold cursor-pointer hover:border-[var(--gold-primary)] transition-all self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Фильтры</span>
          </button>
        </div>

        {isFilterExpanded && (
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Город</label>
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-2.5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="all">Все города</option>
                  <option value="Москва">Москва</option>
                  <option value="Санкт-Петербург">Санкт-Петербург</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Максимальная цена: {maxPrice.toLocaleString()} ₽</label>
                <input 
                  type="range"
                  min="20000"
                  max="500000"
                  step="10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[var(--gold-primary)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {filteredContractors.length === 0 ? (
          <EmptyState
            title="Исполнители не найдены"
            description="Попробуйте изменить параметры фильтра или выберите другую категорию."
            actionLabel="Сбросить фильтры"
            onAction={() => {
              setSelectedCity('all');
              setMaxPrice(500000);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContractors.map(contractor => (
              <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
