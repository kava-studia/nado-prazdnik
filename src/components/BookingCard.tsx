import React from 'react';
import { Calendar, Clock, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import { Booking } from '../types';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface BookingCardProps {
  booking: Booking;
  key?: any;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const navigate = useNavigate();
  const hasPic = booking.contractorImage && !booking.contractorImage.includes('unsplash.com');

  return (
    <div
      className="premium-glass-card rounded-[24px] overflow-hidden p-6 flex flex-col gap-5 border border-[var(--color-border)] hover:border-[var(--color-gold)] transition-all duration-300 shadow-sm text-left select-none"
      id={`booking-card-${booking.id}`}
    >
      {/* Contractor Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-background-soft)] flex items-center justify-center shadow-sm">
            {hasPic ? (
              <img
                src={booking.contractorImage}
                alt={booking.contractorName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xl font-bold text-[var(--color-gold-deep)]">{booking.contractorName[0]}</span>
            )}
          </div>
          <div>
            <h4 className="font-black text-[var(--color-text)] text-base leading-tight">
              {booking.contractorName}
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-bold">
              {booking.selectedService || 'Шоу-программа / Сопровождение'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/contractors/dj/${booking.contractorId}`)}
          className="w-10 h-10 rounded-xl bg-[var(--color-champagne)] border border-[var(--color-gold)]/10 text-[var(--color-gold-deep)] hover:bg-[var(--color-gold-deep)] hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
          id={`view-contractor-from-booking-${booking.id}`}
          title="Профиль подрядчика"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-2.5">
          <Calendar className="w-5 h-5 text-[var(--color-gold)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Дата события</p>
            <p className="font-bold text-[var(--color-text)] mt-0.5">{booking.date}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock className="w-5 h-5 text-[var(--color-gold)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Время и тайминг</p>
            <p className="font-bold text-[var(--color-text)] mt-0.5">
              С {booking.startTime} ({booking.duration} ч.)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:col-span-2">
          <MapPin className="w-5 h-5 text-[var(--color-gold)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Локация проведения</p>
            <p className="font-bold text-[var(--color-text)] mt-0.5">{booking.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2 bg-[var(--color-surface-raised)] px-4 py-3.5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <CreditCard className="w-5 h-5 text-[var(--color-gold-deep)] shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Стоимость услуг</p>
              <p className="text-base font-black text-[var(--color-gold-deep)] font-mono mt-0.5">
                {booking.price.toLocaleString('ru-RU')} ₽
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Авансовый платеж</p>
              <p className="text-base font-black text-[var(--color-text)] font-mono mt-0.5">
                {booking.prepayment.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comment section if any */}
      {booking.comment && (
        <div className="bg-white p-4 rounded-xl text-xs italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-gold)] leading-relaxed shadow-sm">
          <p className="text-xs text-[var(--color-text)] uppercase tracking-wider font-bold not-italic mb-1">Пожелания клиента:</p>
          "{booking.comment}"
        </div>
      )}

      {/* Status Badges */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--color-border)]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--color-text-secondary)] font-bold">Ваш статус:</span>
          <StatusBadge type="client" status={booking.clientStatus} />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--color-text-secondary)] font-bold">Статус координатора:</span>
          <StatusBadge type="contractor" status={booking.contractorStatus} />
        </div>
      </div>
    </div>
  );
}
