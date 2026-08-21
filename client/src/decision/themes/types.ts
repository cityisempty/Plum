import React from 'react';
import { CardData } from '../types';

export interface ThemeCardProps {
  card: CardData;
  isSelected: boolean;
  isDisabled: boolean;
  isPressing?: boolean;
  progress?: number; // 0-100
}

export interface ThemeMiniCardProps {
  card: CardData;
  isFaceUp: boolean;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  appBackgroundClass: string; // Global background for this theme
  CardFace: React.FC<ThemeCardProps>;
  MiniCard: React.FC<ThemeMiniCardProps>;
  BackDesign: React.FC;
}