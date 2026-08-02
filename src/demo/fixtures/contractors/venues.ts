import { ContractorProfile } from '../../../types';

export const venueFixtures: ContractorProfile[] = [
  {
    id: 'c-v1',
    category: 'venue',
    name: 'Усадьба «Платиновый Холл»',
    displayName: 'Усадьба «Платиновый Холл»',
    city: 'Москва',
    description: 'Панорамный загородный комплекс с белым шатром и парковой зоной для выездной регистрации.',
    startingPrice: 180000,
    priceUnit: 'день',
    rating: 4.9,
    reviewsCount: 34,
    verificationStatus: 'verified',
    profileCompleteness: 95,
    demo: true,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'c-v2',
    category: 'venue',
    name: 'Лофт «Графит & Склонение»',
    displayName: 'Лофт «Графит & Склонение»',
    city: 'Москва',
    description: 'Индустриальное пространство в стиле модерн с высокими потолками 7м и акустической подготовкой.',
    startingPrice: 120000,
    priceUnit: 'день',
    rating: 4.8,
    reviewsCount: 22,
    verificationStatus: 'verified',
    profileCompleteness: 90,
    demo: true,
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80'
    ]
  }
];
