/**
 * Centralized Category Data Structure (Guppy marketplace)
 * Reused consistently across Feed top avatars, Categories grid cards, and Search filters.
 *
 * Direct high-quality web image links provided for all guppy category circles.
 */

const make = (id, name, description, color, imageUrl) => ({
  id,
  name,
  tag: id,
  count: description,
  image: imageUrl || `/categories/guppy/${id}.jpg`,
  color,
  bg: `linear-gradient(135deg, ${color} 0%, rgba(12, 18, 16, 0.96) 100%)`,
});

export const CATEGORIES = [
  make('guppy', 'Guppy', 'Premium Guppy Strains & Varieties', '#E08A3C', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Guppy_02.JPG'),
  make('hmpk', 'HMPK', 'Half Moon Plakat Bettas', '#2F7FD1', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop'),
];

/** Number of categories shown directly on the home page; only Guppy and HMPK. */
export const HOME_CATEGORY_COUNT = 2;
