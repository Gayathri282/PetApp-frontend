/**
 * Centralized Category Data Structure (Guppy marketplace)
 * Reused consistently across Feed top avatars, Categories grid cards, and Search filters.
 *
 * Category images: drop your uploaded images into
 *   PetApp-frontend/public/categories/guppy/<id>.jpg
 * (e.g. albino.jpg, blue.jpg ...). Until an image exists, a colored
 * placeholder with the category initial is shown automatically.
 */

const make = (id, name, description, color) => ({
  id,
  name,
  tag: id,
  count: description,
  image: `/categories/guppy/${id}.jpg`,
  color,
  bg: `linear-gradient(135deg, ${color} 0%, rgba(12, 18, 16, 0.96) 100%)`,
});

export const CATEGORIES = [
  make('albino', 'Albino', 'Albino Koi, Full Red, Metal...', '#E9B7C4'),
  make('blue', 'Blue', 'Blue Grass, Diamond, Panda...', '#2F7FD1'),
  make('red', 'Red', 'Red Dragon, Red Lace, Santa...', '#C8372D'),
  make('koi', 'Koi', 'Koi, Tuxedo Koi, Blue Koi...', '#E08A3C'),
  make('platinum', 'Platinum', 'Platinum White, Red Tail...', '#9FB4C7'),
  make('black', 'Black', 'Full Black, Metal Black, Lace...', '#2B2F36'),
  make('snakeskin', 'Snakeskin', 'Snake Skin Dragon, Cobra...', '#7E9C4A'),
  make('gold-yellow', 'Gold & Yellow', 'Full Gold, Yellow Lace, Tiger...', '#E0B72E'),
  make('white', 'White', 'White Koi, Texido, Snow White...', '#D5DEE3'),
  make('silverado', 'Silverado', 'Silverado, HB Blue, Pastel...', '#8A97A6'),
  make('mosaic', 'Mosaic', 'Chilli Mosaic, Moscow, Ivory...', '#B0522E'),
  make('dragon', 'Dragon', 'Blue Dragon, Red Dragon, Half Moon...', '#7A3FA0'),
];

/** Number of categories shown directly on the home page; the rest go under "View more". */
export const HOME_CATEGORY_COUNT = 6;
