// The six pieces in The Edit.
export const products = [
  { id: 'aldine-coat', name: 'The Aldine Coat', detail: 'Oat wool', price: 1290 },
  { id: 'verel-overcoat', name: 'The Verel Overcoat', detail: 'Charcoal wool', price: 1450 },
  { id: 'sola-dress', name: 'The Sola Dress', detail: 'Oxblood silk crepe', price: 890 },
  { id: 'arlo-blazer', name: 'The Arlo Blazer', detail: 'Stone wool', price: 980 },
  { id: 'mira-trouser', name: 'The Mira Trouser', detail: 'Ink wool', price: 520 },
  { id: 'soren-knit', name: 'The Soren Knit', detail: 'Ivory cashmere', price: 640 },
];

export const formatPrice = (value) => `$${value.toLocaleString('en-US')}`;

export const mediaUrl = (path) => `${import.meta.env.BASE_URL}media/${path}`;
