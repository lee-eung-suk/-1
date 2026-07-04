export interface Game {
  id: string;
  title: string;
  grade: '2' | '4';
  creator: string;
  description: string;
  emoji: string;
  color: string;       // Card background styling (e.g. bg-rose-50 text-rose-600)
  accentColor: string; // Solid focus background (e.g. bg-rose-500)
  badgeColor: string;  // Tag background (e.g. bg-rose-100 text-rose-700)
  tags: string[];
  originalIdea: string; // 기획 의도
  instructions: string[]; // 게임 방법
}

export interface GameComment {
  id: string;
  gameId: string;
  author: string;
  content: string;
  date: string;
}

export interface GameStats {
  likes: number;
  playCount: number;
}
