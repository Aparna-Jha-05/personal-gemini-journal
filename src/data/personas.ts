import type { PersonaDefinition, PersonaId } from '../types';

export const PERSONAS: Record<PersonaId, PersonaDefinition> = {
  socratic: {
    id: 'socratic',
    name: 'Socratic Thinker',
    tagline: 'Inquiry-Driven Self-Reflection',
    description: 'Probes foundational assumptions, surfaces cognitive blindspots, and gently guides you toward organic clarity.',
    badge: 'Inquiry & Depth',
    accentColor: 'indigo',
  },
  executive: {
    id: 'executive',
    name: 'Executive Strategist',
    tagline: 'High-Leverage Decision Frameworks',
    description: 'Cuts through mental friction, structures trade-offs, and converts complex ambiguities into prioritized action steps.',
    badge: 'Strategy & Focus',
    accentColor: 'emerald',
  },
  creative: {
    id: 'creative',
    name: 'Creative Muse',
    tagline: 'Lateral & Divergent Exploration',
    description: 'Inspires poetic framing, unconventional analogies, and lateral associations to illuminate fresh perspectives.',
    badge: 'Originality & Vision',
    accentColor: 'amber',
  },
  stoic: {
    id: 'stoic',
    name: 'Mindful Stoic',
    tagline: 'Equilibrium & Dichotomy of Control',
    description: 'Centers on what is within your agency, cultivates resilience, and reframes turmoil into inner strength.',
    badge: 'Wisdom & Balance',
    accentColor: 'slate',
  },
};
