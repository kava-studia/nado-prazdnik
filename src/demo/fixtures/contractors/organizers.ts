import { ContractorProfile } from '../../../types';

export const organizerFixtures: ContractorProfile[] = [
  {
    id: 'c-org1',
    category: 'organizer',
    name: 'Агентство «NADO Event Management»',
    displayName: 'Агентство «NADO Event Management»',
    city: 'Москва',
    description: 'Организация событий «под ключ». Разработка концепции, подбор подрядчиков, координация в день мероприятия.',
    startingPrice: 150000,
    priceUnit: 'проект',
    rating: 4.98,
    reviewsCount: 45,
    verificationStatus: 'verified',
    profileCompleteness: 98,
    demo: true,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'
  }
];
