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
  make('albino', 'Albino', 'Albino Koi, Full Red, Metal...', '#E9B7C4', 'https://images.unsplash.com/photo-1520301255226-bf5f144451c1?w=400&auto=format&fit=crop'),
  make('blue', 'Blue', 'Blue Grass, Diamond, Panda...', '#2F7FD1', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&auto=format&fit=crop'),
  make('red', 'Red', 'Red Dragon, Red Lace, Santa...', '#C8372D', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop'),
  make('koi', 'Koi', 'Koi, Tuxedo Koi, Blue Koi...', '#E08A3C', 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&auto=format&fit=crop'),
  make('platinum', 'Platinum', 'Platinum White, Red Tail...', '#9FB4C7', 'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=400&auto=format&fit=crop'),
  make('black', 'Black', 'Full Black, Metal Black, Lace...', '#2B2F36', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop'),
  make('snakeskin', 'Snakeskin', 'Snake Skin Dragon, Cobra...', '#7E9C4A', 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&auto=format&fit=crop'),
  make('gold-yellow', 'Gold & Yellow', 'Full Gold, Yellow Lace, Tiger...', '#E0B72E', 'https://images.unsplash.com/photo-1497671954146-59a89ff626ff?w=400&auto=format&fit=crop'),
  make('white', 'White', 'White Koi, Texido, Snow White...', '#D5DEE3', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Guppy_02.JPG'),
  make('silverado', 'Silverado', 'Silverado, HB Blue, Pastel...', '#8A97A6', 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=400&auto=format&fit=crop'),
  make('mosaic', 'Mosaic', 'Chilli Mosaic, Moscow, Ivory...', '#B0522E', 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&auto=format&fit=crop'),
  make('dragon', 'Dragon', 'Blue Dragon, Red Dragon, Half Moon...', '#7A3FA0', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&auto=format&fit=crop'),
];

/** Number of categories shown directly on the home page; the rest go under "View more". */
export const HOME_CATEGORY_COUNT = 6;
