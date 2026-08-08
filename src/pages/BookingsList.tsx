import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import BookingCard from '../components/BookingCard';
import { EmptyState } from '../components/UI';
import { Booking } from '../types';
import { useRepositories } from '../repositories/RepositoryProvider';

export default function BookingsList() {
  const navigate = useNavigate();
  const { orderRepository } = useRepositories();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    let isMounted = true;
    orderRepository.listOrders().then(list => {
      if (isMounted) setBookings(list || []);
    }).catch(e => {
      console.error(e);
      if (isMounted) setBookings([]);
    });
    return () => { isMounted = false; };
  }, [orderRepository]);

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--text-primary)] animate-fade-in" id="bookings-list-view">
      <AppHeader title="Бронирования" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 text-left">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Ваши бронирования</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Договоры, статусы согласований и условия сотрудничества с event-специалистами.
            </p>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-5" id="bookings-items-list">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Список бронирований пуст"
              description="Вы ещё не резервировали специалистов. Ознакомьтесь с каталогом NADO ПРАЗДНИК и выберите идеального исполнителя."
              icon={CalendarRange}
              ctaText="Перейти в каталог"
              onCtaClick={() => navigate('/catalog/djs')}
            />
          )}

        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
