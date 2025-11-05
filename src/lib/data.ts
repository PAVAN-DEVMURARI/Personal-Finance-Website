import type { LucideIcon } from "lucide-react";
import { Award, Pizza, Plane, Home, ShoppingCart, Clapperboard, Shirt, BrainCircuit, Dumbbell, Wallet } from "lucide-react";

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
};

export type Investment = {
  id: string;
  name: string;
  type: 'Stocks' | 'Crypto' | 'Mutual Funds' | 'ETFs';
  value: number;
  monthlyChange: number;
};

export type Badge = {
  id: string;
  name: string;
  icon: LucideIcon;
  achieved: boolean;
};

// Mock data is no longer needed as we are using Firebase.
// This file can be removed or kept for type definitions.

export const transactions: Transaction[] = [];

export const goals: Goal[] = [];

export const investments: Investment[] = [];

export const badges: Badge[] = [
    { id: '1', name: 'Budget Beginner', icon: Award, achieved: true },
    { id: '2', name: 'Savings Starter', icon: Award, achieved: true },
    { id: '3', name: 'Expense Expert', icon: Award, achieved: false },
    { id: '4', name: 'Goal Getter', icon: Award, achieved: false },
    { id: '5', name: 'Investment Pro', icon: Award, achieved: false },
];

export const dailyStreak = 7;

export const categoryIcons: { [key: string]: LucideIcon } = {
  Food: Pizza,
  Travel: Plane,
  Rent: Home,
  Shopping: ShoppingCart,
  Entertainment: Clapperboard,
  Apparel: Shirt,
  Education: BrainCircuit,
  Health: Dumbbell,
  Default: Wallet,
};

export const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons['Default'];
};
