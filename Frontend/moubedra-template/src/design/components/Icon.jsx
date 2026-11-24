import {
  Activity, Armchair, ArrowRight, Backpack, BadgeCheck, Bell, BookOpen, CalendarDays, Camera, Check, CircleCheck, Clock3,
  Coffee, Droplets, Flag, Gamepad2, Hand, HandHeart, Heart, Images, Info, Megaphone, MessageCircle, Milk, Package, PackageCheck,
  PackageOpen, Pencil, Receipt, Shirt, ShieldCheck, ShoppingBasket, Shovel, Siren, Smartphone, Sofa, Sprout, Trash2, TrendingUp,
  Trophy, User, UserCheck, UserX, Users, Vote, Wallet, Wheat,
} from 'lucide-react';

/**
 * Icônes référencées par leur nom (kebab-case, comme dans la maquette) — utile quand
 * l'icône vient des données (`icone: 'backpack'`). Dans le JSX, importez plutôt
 * directement le composant depuis 'lucide-react'.
 * Ajoutez ici toute nouvelle icône nommée dans des données.
 */
const ICONS = {
  activity: Activity, armchair: Armchair, 'arrow-right': ArrowRight, backpack: Backpack, 'badge-check': BadgeCheck, bell: Bell,
  'book-open': BookOpen, 'calendar-days': CalendarDays, camera: Camera, check: Check, 'circle-check': CircleCheck, 'clock-3': Clock3,
  coffee: Coffee, droplets: Droplets, flag: Flag, 'gamepad-2': Gamepad2, hand: Hand, 'hand-heart': HandHeart, heart: Heart,
  images: Images, info: Info, megaphone: Megaphone, 'message-circle': MessageCircle, milk: Milk, package: Package,
  'package-check': PackageCheck, 'package-open': PackageOpen, pencil: Pencil, receipt: Receipt, shirt: Shirt, 'shield-check': ShieldCheck,
  'shopping-basket': ShoppingBasket, shovel: Shovel, siren: Siren, smartphone: Smartphone, sofa: Sofa, sprout: Sprout, 'trash-2': Trash2,
  'trending-up': TrendingUp, trophy: Trophy, user: User, 'user-check': UserCheck, 'user-x': UserX, users: Users, vote: Vote,
  wallet: Wallet, wheat: Wheat,
};

export default function Icon({ name, size = 18, ...rest }) {
  const Cmp = ICONS[name];
  if (!Cmp) {
    if (import.meta.env.DEV) console.warn(`[Icon] icône inconnue : ${name} (à ajouter dans design/components/Icon.jsx)`);
    return null;
  }
  return <Cmp size={size} aria-hidden="true" {...rest} />;
}
