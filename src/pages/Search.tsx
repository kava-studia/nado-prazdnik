import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Sparkles, 
  Users, 
  Music, 
  Camera, 
  Video, 
  Paintbrush, 
  UtensilsCrossed, 
  Speaker, 
  PartyPopper, 
  Bus, 
  ShieldCheck, 
  Search as SearchIcon 
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { EventServiceCategory } from '../types';

interface SearchCategory {
  key: EventServiceCategory;
  title: string;
  description: string;
  icon: any;
  route: string;
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  { key: 'venue', title: 'Площадки', description: 'Банкетные залы, загородные виллы, лофты и веранды', icon: Building2, route: '/catalog/venue' },
  { key: 'organizer', title: 'Организаторы', description: 'Специалисты для планирования и проведения под ключ', icon: Sparkles, route: '/catalog/organizer' },
  { key: 'host', title: 'Ведущие', description: 'Интерактивные ведущие для создания атмосферы', icon: Users, route: '/catalog/host' },
  { key: 'dj', title: 'Диджеи', description: 'Музыкальные мастера со звуковыми пультами', icon: Music, route: '/catalog/dj' },
  { key: 'photographer', title: 'Фотографы', description: 'Репортажные и художественные кадры на память', icon: Camera, route: '/catalog/photographer' },
  { key: 'videographer', title: 'Видеографы', description: 'Съемка фильмов, свадебных клипов и рилсов', icon: Video, route: '/catalog/videographer' },
  { key: 'decorator', title: 'Декораторы', description: 'Дизайнеры оформления залов и столов гостей', icon: Paintbrush, route: '/catalog/decorator' },
  { key: 'catering', title: 'Кейтеринг', description: 'Выездные фуршеты, кофе-брейки и изысканные банкеты', icon: UtensilsCrossed, route: '/catalog/catering' },
  { key: 'equipment', title: 'Звук и свет', description: 'Аренда сценического звука, света и экранов', icon: Speaker, route: '/catalog/equipment' },
  { key: 'artists', title: 'Артисты и шоу', description: 'Кавер-группы, фокусники и танцевальные шоу', icon: PartyPopper, route: '/catalog/artists' },
  { key: 'transport', title: 'Транспорт', description: 'Лимузины, автобусы для трансфера гостей и минивэны', icon: Bus, route: '/catalog/transport' },
  { key: 'coordinator', title: 'Координаторы', description: 'Распорядители для безупречного контроля в день события', icon: ShieldCheck, route: '/catalog/coordinator' }
];

export default function Search() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--color-text)] animate-fade-in" id="search-view">
      <AppHeader title="Поиск услуг" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 text-left">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-[var(--color-gold)]" />
            Каталог специалистов
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Выберите нужную категорию подрядчиков, чтобы найти лучшие предложения под ваш бюджет и формат
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEARCH_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div
                key={cat.key}
                onClick={() => navigate(cat.route)}
                className="group rounded-2xl bg-white border border-[var(--color-border)] hover:border-[var(--color-gold)] p-5 flex items-start gap-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md select-none active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-gold-deep)] shrink-0 group-hover:bg-[var(--color-champagne)] group-hover:border-[var(--color-gold)]/20 transition-all shadow-sm">
                  <IconComp className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-[var(--color-text)] text-base group-hover:text-[var(--color-gold-deep)] transition-colors truncate">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
