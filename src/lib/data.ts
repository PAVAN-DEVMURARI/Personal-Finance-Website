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

export const transactions: Transaction[] = [
  { id: '1', type: 'expense', category: 'Food', description: 'Dinner with friends', amount: 4500, date: '2024-07-28' },
  { id: '2', type: 'income', category: 'Salary', description: 'July Salary', amount: 208000, date: '2024-07-25' },
  { id: '3', type: 'expense', category: 'Travel', description: 'Flight to SF', amount: 29000, date: '2024-07-22' },
  { id: '4', type: 'expense', category: 'Rent', description: 'August Rent', amount: 67000, date: '2024-07-20' },
  { id: '5', type: 'expense', category: 'Shopping', description: 'New shoes', amount: 10000, date: '2024-07-18' },
  { id: '6', type: 'income', category: 'Freelance', description: 'Web design project', amount: 41500, date: '2024-07-15' },
  { id: '7', type: 'expense', category: 'Entertainment', description: 'Movie tickets', amount: 2000, date: '2024-07-12' },
];

export const goals: Goal[] = [
  { id: '1', name: 'Vacation to Japan', targetAmount: 332000, currentAmount: 150000, deadline: '2025-06-01' },
  { id: '2', name: 'New Laptop', targetAmount: 125000, currentAmount: 120000, deadline: '2024-08-30' },
  { id: '3', name: 'Emergency Fund', targetAmount: 415000, currentAmount: 266000, deadline: '2025-01-01' },
];

export const investments: Investment[] = [
    { id: '1', name: 'Vanguard S&P 500 ETF', type: 'ETFs', value: 432000, monthlyChange: 2.5 },
    { id: '2', name: 'Bitcoin', type: 'Crypto', value: 175000, monthlyChange: -5.2 },
    { id: '3', name: 'Fidelity Blue Chip Growth', type: 'Mutual Funds', value: 650000, monthlyChange: 1.8 },
    { id: '4', name: 'Apple Inc.', type: 'Stocks', value: 290000, monthlyChange: 7.1 },
];

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
