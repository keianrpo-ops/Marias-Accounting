
import React from 'react';

export const THEME = {
  primary: '#20B2AA', // Turquesa Maria's
  secondary: '#FF6B9D', // Rosa Coral
  accent: '#C6FF00', 
  bg: '#F8F9FA', 
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B'
};

export const PRICING_TIERS = [
  { name: 'Silver', min: 6, max: 20, discount: 0.15, icon: '🥈', description: 'Nivel inicial para tiendas pequeñas.' },
  { name: 'Gold', min: 21, max: 50, discount: 0.25, icon: '🥇', description: 'Ideal para negocios en crecimiento.' },
  { name: 'Platinum', min: 51, max: 100, discount: 0.35, icon: '💎', description: 'Beneficios exclusivos y soporte directo.' },
  { name: 'Diamond', min: 101, max: 9999, discount: 0.45, icon: '💍', description: 'Máximo margen para partners estratégicos.' }
];

/** 
 * NOTA PARA MARÍA: 
 * Puedes usar archivos .png, .jpg o .jpeg. 
 * Solo asegúrate de cambiar la extensión aquí abajo para que coincida con tu archivo real.
 */
export const PRODUCTS = [
  { 
    id: 'p1', 
    name: 'Premium Salmon Bites', 
    basePrice: 6.00, 
    category: 'Snack', 
    icon: '🐟', 
    image: './assets/products/salmon.jpg', // Ejemplo en JPG
    description: 'Salmón del Atlántico deshidratado a baja temperatura para preservar Omega-3 y sabor intenso.'
  },
  { 
    id: 'p2', 
    name: 'Gourmet Lamb Tendons', 
    basePrice: 5.50, 
    category: 'Snack', 
    icon: '🍖', 
    image: './assets/products/lamb.png', // Ejemplo en PNG
    description: 'Tendones de cordero británico, ideales para la salud dental y una masticación prolongada y segura.'
  },
  { 
    id: 'p3', 
    name: 'Pure Beef Cubes', 
    basePrice: 5.00, 
    category: 'Snack', 
    icon: '🥩', 
    image: './assets/products/beef.jpg', 
    description: 'Dados de ternera 100% magra deshidratados, sin aditivos, conservantes ni colorantes.'
  },
  { 
    id: 'p4', 
    name: 'Chicken Breast Fillets', 
    basePrice: 5.00, 
    category: 'Snack', 
    icon: '🍗', 
    image: './assets/products/chicken.png', 
    description: 'Pechuga de pollo de corral deshidratada, el snack clásico para un entrenamiento saludable.'
  },
  { 
    id: 'p5', 
    name: 'Organic Liver Crisps', 
    basePrice: 5.00, 
    category: 'Snack', 
    icon: '🥓', 
    image: './assets/products/liver.jpg', 
    description: 'Hígado orgánico crujiente, rico en hierro y vitaminas, amado por los perros más exigentes.'
  },
  { 
    id: 'p6', 
    name: 'Nutri-Crunch Veggie Mix', 
    basePrice: 4.50, 
    category: 'Snack', 
    icon: '🥦', 
    image: './assets/products/veggie.png', 
    description: 'Mezcla premium de verduras deshidratadas y hierbas digestivas para una salud intestinal óptima.'
  },
];

export const SERVICES = [
  { id: 's1', name: 'Dog Walking', price: 15, category: 'Service', icon: '🌳', image: './assets/services/walking.jpg' },
  { id: 's2', name: 'Home Sitting', price: 45, category: 'Service', icon: '🏠', image: './assets/services/sitting.png' },
  { id: 's3', name: 'Grooming', price: 35, category: 'Service', icon: '✂️', image: './assets/services/grooming.jpg' },
  { id: 's4', name: 'Pop-in Visit', price: 12, category: 'Service', icon: '🚪', image: './assets/services/popin.png' },
  { id: 's5', name: 'Dog Boarding', price: 35, category: 'Service', icon: '🌙', image: './assets/services/boarding.jpg' },
];

export const EXPENSE_CATEGORIES = [
  'Ingredientes Premium',
  'Packaging Eco-Friendly',
  'Marketing & RRSS',
  'Logística UK',
  'Seguros & Otros'
];
