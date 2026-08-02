import { ContractorProfile } from '../../../types';

export const hostFixtures: ContractorProfile[] = [
  {
    id: 'c-founder',
    category: 'host',
    name: 'MC KAVA',
    displayName: 'MC KAVA',
    city: 'Москва',
    description: 'Основатель NADO ПРАЗДНИК. Ведение премиальных частных и корпоративных событий. Кастомная программа без шаблонов.',
    startingPrice: 150000,
    priceUnit: 'программа',
    isFounderChoice: true,
    verificationStatus: 'verified',
    profileCompleteness: 100,
    demo: false,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'c-h1',
    category: 'host',
    name: 'Александр Вершин',
    displayName: 'Александр Вершин',
    city: 'Москва',
    description: 'Интеллигентный ведущий с опытом работы на ТВ. Легкий юмор, импровизация, чувство такта.',
    startingPrice: 90000,
    priceUnit: 'программа',
    rating: 4.95,
    reviewsCount: 42,
    verificationStatus: 'verified',
    profileCompleteness: 92,
    demo: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    portfolio: []
  }
];
