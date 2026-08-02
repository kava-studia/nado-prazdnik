import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  CheckCircle2, 
  AlertTriangle,
  Building2, 
  User, 
  Music, 
  Camera, 
  Video, 
  Flower2, 
  Sparkles, 
  Utensils, 
  Volume2, 
  Car, 
  CalendarCheck
} from 'lucide-react';
import { Contractor } from '../types';

interface ContractorCardProps {
  contractor: Contractor;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  key?: any;
}

const categoryIconMap: Record<string, any> = {
  venues: Building2,
  hosts: User,
  djs: Music,
  photographers: Camera,
  videographers: Video,
  decorators: Flower2,
  artists: Sparkles,
  catering: Utensils,
  equipment: Volume2,
  transport: Car,
  coordinators: CalendarCheck,
};

const categoryNameMap: Record<string, string> = {
  venues: 'Площадка',
  hosts: 'Ведущий',
  djs: 'Диджей',
  photographers: 'Фотограф',
  videographers: 'Видеограф',
  decorators: 'Декоратор',
  artists: 'Артист',
  catering: 'Кейтеринг',
  equipment: 'Звук и свет',
  transport: 'Транспорт',
  coordinators: 'Координатор',
};

export default function ContractorCard({ contractor, onFavoriteToggle }: ContractorCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('nado_favorites') || '[]');
    setIsFavorite(favorites.includes(contractor.id));
  }, [contractor.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('nado_favorites') || '[]');
    let updated: string[];

    if (isFavorite) {
      updated = favorites.filter((id: string) => id !== contractor.id);
    } else {
      updated = [...favorites, contractor.id];
    }

    localStorage.setItem('nado_favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
    if (onFavoriteToggle) {
      onFavoriteToggle(contractor.id, !isFavorite);
    }
  };

  const IconComponent = categoryIconMap[contractor.category] || Sparkles;
  const hasImage = contractor.image && !contractor.image.includes('unsplash.com');

  return (
    <div
      onClick={() => navigate(`/contractors/dj/${contractor.id}`)}
      className="bg-[var(--background-elevated)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 rounded-[24px] overflow-hidden cursor-pointer relative group flex flex-col h-full transition-all duration-300 shadow-md select-none active:scale-[0.99]"
      id={`contractor-card-${contractor.id}`}
    >
      {/* Photo / Category Icon Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--background-secondary)] flex items-center justify-center">
        {hasImage ? (
          <img
            src={contractor.image}
            alt={contractor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-[var(--text-secondary)]">
            <div className="w-16 h-16 rounded-full bg-[var(--gold-highlight)] flex items-center justify-center text-[var(--gold-deep)] mb-3 group-hover:scale-110 transition-transform shadow-sm">
              <IconComponent className="w-8 h-8" />
            </div>
            <span className="text-xs font-extrabold tracking-wide uppercase text-[var(--text-secondary)]">
              {categoryNameMap[contractor.category] || 'Специалист'}
            </span>
          </div>
        )}
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40 pointer-events-none" />

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--background-elevated)]/80 backdrop-blur-md text-[var(--text-primary)] hover:text-red-500 hover:scale-110 active:scale-95 flex items-center justify-center border border-[var(--border-soft)] transition-all z-10 cursor-pointer shadow-sm"
          id={`favorite-button-${contractor.id}`}
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-[var(--text-primary)]'
            }`}
          />
        </button>

        {/* Founder's Choice Badge */}
        {contractor.isFounderChoice && (
          <span className="absolute bottom-4 left-4 bg-gradient-to-r from-[var(--gold-deep)] to-[var(--gold-primary)] text-white text-xs font-bold tracking-wider px-3.5 py-1 rounded-full shadow-md uppercase">
            Выбор NADO
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between text-left">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-black tracking-tight text-[var(--text-primary)] group-hover:text-[var(--gold-deep)] transition-colors leading-snug truncate">
              {contractor.name}
            </h3>
            {contractor.reviewsCount > 0 ? (
              <div className="flex items-center gap-1 shrink-0 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 px-2 py-0.5 rounded-lg text-xs">
                <Star className="w-3.5 h-3.5 text-[var(--gold-deep)] fill-[var(--gold-deep)]" />
                <span className="font-extrabold text-[var(--gold-deep)]">{contractor.rating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>{contractor.city}</span>
            <span>{contractor.reviewsCount > 0 ? `${contractor.reviewsCount} отзывов` : 'Пока нет отзывов'}</span>
          </div>
        </div>

        <div>
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 mb-5">
            {contractor.isAvailable ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#3E8B65] bg-[#EAF5EE] border border-[#3E8B65]/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Свободен
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#B94D4D] bg-[#FDF0F0] border border-[#B94D4D]/25 px-3 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" /> Занят в эти даты
              </span>
            )}
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-soft)] gap-3">
            <div>
              <p className="text-xs text-[var(--text-secondary)] tracking-wider uppercase font-bold">Стоимость</p>
              <p className="text-base font-black text-[var(--text-primary)] leading-tight font-mono">
                от {contractor.price.toLocaleString('ru-RU')} ₽
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/contractors/dj/${contractor.id}`);
              }}
              className="min-h-[40px] bg-[var(--gold-highlight)] hover:bg-[var(--gold-primary)] border border-[var(--gold-primary)]/20 text-[var(--gold-deep)] hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
              id={`open-contractor-${contractor.id}`}
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
