import {
  Smile,
  Compass,
  Zap,
  Sun,
  Sparkles,
  Activity,
  Heart,
  Minus,
  Target,
  Flame,
  CheckCircle2,
  Wind,
  Coffee,
  type LucideIcon,
} from 'lucide-react';
import type { MoodId, ProductivityStatusId } from '../types';

export interface MoodOption {
  id: MoodId;
  label: string;
  icon: LucideIcon;
  emoji: string;
  colorLight: string;
  colorDark: string;
  bgLight: string;
  bgDark: string;
}

export interface ProductivityOption {
  id: ProductivityStatusId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  badgeColorLight: string;
  badgeColorDark: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'happy',
    label: 'Happy',
    icon: Smile,
    emoji: '😊',
    colorLight: 'text-amber-600',
    colorDark: 'text-amber-400',
    bgLight: 'bg-amber-100 border-amber-300',
    bgDark: 'bg-amber-500/15 border-amber-500/30',
  },
  {
    id: 'reflective',
    label: 'Reflective',
    icon: Compass,
    emoji: '🧭',
    colorLight: 'text-indigo-600',
    colorDark: 'text-indigo-400',
    bgLight: 'bg-indigo-100 border-indigo-300',
    bgDark: 'bg-indigo-500/15 border-indigo-500/30',
  },
  {
    id: 'productive',
    label: 'Productive',
    icon: Zap,
    emoji: '⚡',
    colorLight: 'text-emerald-600',
    colorDark: 'text-emerald-400',
    bgLight: 'bg-emerald-100 border-emerald-300',
    bgDark: 'bg-emerald-500/15 border-emerald-500/30',
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: Sun,
    emoji: '☀️',
    colorLight: 'text-sky-600',
    colorDark: 'text-sky-400',
    bgLight: 'bg-sky-100 border-sky-300',
    bgDark: 'bg-sky-500/15 border-sky-500/30',
  },
  {
    id: 'inspired',
    label: 'Inspired',
    icon: Sparkles,
    emoji: '✨',
    colorLight: 'text-purple-600',
    colorDark: 'text-purple-400',
    bgLight: 'bg-purple-100 border-purple-300',
    bgDark: 'bg-purple-500/15 border-purple-500/30',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    icon: Heart,
    emoji: '💖',
    colorLight: 'text-rose-600',
    colorDark: 'text-rose-400',
    bgLight: 'bg-rose-100 border-rose-300',
    bgDark: 'bg-rose-500/15 border-rose-500/30',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    icon: Activity,
    emoji: '🌧️',
    colorLight: 'text-orange-600',
    colorDark: 'text-orange-400',
    bgLight: 'bg-orange-100 border-orange-300',
    bgDark: 'bg-orange-500/15 border-orange-500/30',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    icon: Minus,
    emoji: '⚖️',
    colorLight: 'text-slate-600',
    colorDark: 'text-slate-400',
    bgLight: 'bg-slate-200 border-slate-300',
    bgDark: 'bg-slate-800 border-slate-700',
  },
];

export const PRODUCTIVITY_OPTIONS: ProductivityOption[] = [
  {
    id: 'deep_focus',
    label: 'Deep Focus',
    subtitle: 'High immersion & clarity',
    icon: Target,
    badgeColorLight: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    badgeColorDark: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'in_flow',
    label: 'In Flow',
    subtitle: 'Effortless momentum',
    icon: Flame,
    badgeColorLight: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    badgeColorDark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'steady',
    label: 'Steady',
    subtitle: 'Consistent output',
    icon: CheckCircle2,
    badgeColorLight: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeColorDark: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    id: 'distracted',
    label: 'Distracted',
    subtitle: 'Fragmented attention',
    icon: Wind,
    badgeColorLight: 'bg-amber-100 text-amber-700 border-amber-200',
    badgeColorDark: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'recharge',
    label: 'Recharge',
    subtitle: 'Restorative recovery',
    icon: Coffee,
    badgeColorLight: 'bg-violet-100 text-violet-700 border-violet-200',
    badgeColorDark: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
];
