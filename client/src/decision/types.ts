export interface CardData {
  id: string;
  name: string;
  symbol: string; // Emoji or simple text representation
  imageUrl: string; // Path to the image file
  description: string;
  element: 'Fire' | 'Water' | 'Air' | 'Earth' | 'Spirit';
  uprightMeaning?: string;
  reversedMeaning?: string;
}

export interface PlacedCard {
  cardId: string;
  gridIndex: number; // 0-8 (3x3 grid)
  isFaceUp: boolean;
}

export enum AppPhase {
  WELCOME = 'WELCOME',
  USER_INFO = 'USER_INFO',
  SELECTION = 'SELECTION',
  PLACEMENT = 'PLACEMENT',
  REVIEW = 'REVIEW',
  ANALYSIS = 'ANALYSIS',
  RESULT = 'RESULT'
}

export interface GridSlot {
  index: number;
  occupiedBy?: PlacedCard;
}

export interface GridDefinition {
  name: string;
  timeSpace: string;
  focus: string;
  source: string;
  positiveMeaning: string;
  negativeMeaning: string;
}

export type ThemeId = 'classic' | 'modern';