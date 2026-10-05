import {
  Award,
  BadgeCheck,
  Bus,
  CalendarCheck,
  Camera,
  Car,
  Clock,
  Compass,
  Headphones,
  Heart,
  Hotel,
  Landmark,
  Mail,
  MapPin,
  Mountain,
  Phone,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
  Sun,
  Tent,
  ThumbsUp,
  Train,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Icons a config may reference by name. Keep the list small so pages stay light. */
export const ICONS: Record<string, LucideIcon> = {
  award: Award,
  badge: BadgeCheck,
  bus: Bus,
  calendar: CalendarCheck,
  camera: Camera,
  car: Car,
  clock: Clock,
  compass: Compass,
  support: Headphones,
  heart: Heart,
  hotel: Hotel,
  landmark: Landmark,
  mail: Mail,
  pin: MapPin,
  mountain: Mountain,
  phone: Phone,
  plane: Plane,
  shield: ShieldCheck,
  ship: Ship,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  tent: Tent,
  "thumbs-up": ThumbsUp,
  train: Train,
  users: Users,
  food: Utensils,
  wallet: Wallet,
};

export const ICON_NAMES = Object.keys(ICONS) as [string, ...string[]];

export function Icon({ name, className = "size-6" }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} aria-hidden="true" />;
}

/** WhatsApp has no Lucide icon (brands are excluded), so a simple chat-bubble glyph stands in. */
export function WhatsAppIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
