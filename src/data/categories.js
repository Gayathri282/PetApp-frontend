/**
 * Centralized Category Data Structure
 * Reused consistently across Feed top avatars, Categories grid cards, and Search filters.
 * Uses exact uploaded high-res image assets from /public/categories/
 */

export const CATEGORIES = [
  {
    id: 'dog',
    name: 'Dogs',
    tag: 'dog',
    count: '125+ Listings',
    shortCount: '125+',
    image: '/categories/dog.jpg',
    bg: 'linear-gradient(135deg, rgba(50, 42, 22, 0.88) 0%, rgba(18, 16, 10, 0.96) 100%)',
  },
  {
    id: 'cat',
    name: 'Cats',
    tag: 'cat',
    count: '89+ Listings',
    shortCount: '89+',
    image: '/categories/cat.jpg',
    bg: 'linear-gradient(135deg, rgba(38, 33, 26, 0.88) 0%, rgba(14, 13, 11, 0.96) 100%)',
  },
  {
    id: 'bird',
    name: 'Birds',
    tag: 'bird',
    count: '45+ Listings',
    shortCount: '45+',
    image: '/categories/bird.jpg',
    bg: 'linear-gradient(135deg, rgba(30, 44, 25, 0.88) 0%, rgba(12, 18, 11, 0.96) 100%)',
  },
  {
    id: 'fish',
    name: 'Fish',
    tag: 'fish',
    count: '30+ Listings',
    shortCount: '30+',
    image: '/categories/fish.jpg',
    bg: 'linear-gradient(135deg, rgba(18, 40, 34, 0.88) 0%, rgba(10, 18, 15, 0.96) 100%)',
  },
  {
    id: 'other',
    name: 'Small Pets',
    tag: 'other',
    count: '20+ Listings',
    shortCount: '20+',
    image: '/categories/small-pets.jpg',
    bg: 'linear-gradient(135deg, rgba(30, 38, 32, 0.88) 0%, rgba(12, 16, 14, 0.96) 100%)',
  },
  {
    id: 'services',
    name: 'Pet Services',
    tag: 'services',
    featureKey: 'services',
    count: '60+ Listings',
    shortCount: '60+',
    image: '/categories/services.jpg',
    bg: 'linear-gradient(135deg, rgba(46, 40, 24, 0.88) 0%, rgba(18, 16, 10, 0.96) 100%)',
  },
];
