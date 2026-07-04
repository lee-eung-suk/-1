import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gamesData } from './data';
import { Game } from './types';
import GameEmulator from './components/GameEmulator';
import { playSound } from './utils/audio';
import { 
  Heart, 
  Search, 
  Play, 
  Sparkles, 
  Star, 
  MessageSquare, 
  Flame, 
  Compass, 
  Users, 
  GraduationCap, 
  Award,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeGrade, setActiveGrade] = useState<'all' | '2' | '4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time Local Likes & Play counts to make the site reactive and alive!
  const [gameStats, setGameStats] = useState<Record<string, { likes: number; plays: number }>>({});

  // Initialize stats with sweet initial counts + user local adjustments
  useEffect(() => {
    const stats: Record<string, { likes: number; plays: number }> = {};
    
    // Base starter values
    const baseStats: Record<string, { likes: number; plays: number }> = {
      'space-explorer': { likes: 142, plays: 642 },
      'cat-feast': { likes: 189, plays: 750 },
      'jump-dino': { likes: 165, plays: 810 },
      'color-pop': { likes: 120, plays: 520 },
      'candy-sneak': { likes: 235, plays: 980 },
      'duck-maze': { likes: 154, plays: 430 }
    };

    gamesData.forEach(game => {
      const savedLikes = localStorage.getItem(`likes-${game.id}`);
      const savedPlays = localStorage.getItem(`plays-${game.id}`);
      
      stats[game.id] = {
        likes: savedLikes ? parseInt(savedLikes, 10) : baseStats[game.id].likes,
        plays: savedPlays ? parseInt(savedPlays, 10) : baseStats[game.id].plays
      };
    });

    setGameStats(stats);
  }, []);

  // Handle Like/Upvote
  const handleLike = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation(); // prevent opening the game
    playSound('coin');
    
    setGameStats(prev => {
      const current = prev[gameId] || { likes: 0, plays: 0 };
      const hasLiked = localStorage.getItem(`liked-flag-${gameId}`);
      
      let nextLikes = current.likes;
      if (hasLiked) {
        // Toggle off
        nextLikes -= 1;
        localStorage.removeItem(`liked-flag-${gameId}`);
      } else {
        // Toggle on
        nextLikes += 1;
        localStorage.setItem(`liked-flag-${gameId}`, 'true');
      }

      localStorage.setItem(`likes-${gameId}`, nextLikes.toString());
      return {
        ...prev,
        [gameId]: {
          ...current,
          likes: nextLikes
        }
      };
    });
  };

  // Launch Game and increment play count
  const handleLaunchGame = (game: Game) => {
    playSound('win');
    
    // Increment play count locally
    setGameStats(prev => {
      const current = prev[game.id] || { likes: 0, plays: 0 };
      const nextPlays = current.plays + 1;
      localStorage.setItem(`plays-${game.id}`, nextPlays.toString());
      return {
        ...prev,
        [game.id]: {
          ...current,
          plays: nextPlays
        }
      };
    });

    setSelectedGame(game);
  };

  // Filter games based on grade and search query
  const filteredGames = gamesData.filter(game => {
    const matchesGrade = activeGrade === 'all' || game.grade === activeGrade;
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesGrade && matchesSearch;
  });

  return (
    <div id="app-root" className="min-h-screen bg-[#FBFBFD] text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-700">
      
      {/* 1. Translucent macOS-Style Sticky Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-black/5 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveGrade('all'); setSearchQuery(''); }}>
            <span className="text-2xl animate-float-medium">🎮</span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                우리 반 게임 아케이드
                <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold">LIVE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">꼬마 개발자들의 상상 놀이터</span>
            </div>
          </div>

          {/* Quick HUD Link */}
          <div className="hidden sm:flex items-center gap-5 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              2학년 (3작품)
            </span>
            <span className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
              4학년 (3작품)
            </span>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="bg-slate-100 text-slate-700 font-display px-3 py-1 rounded-full text-[10px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              총 플레이 {(Object.values(gameStats) as { likes: number; plays: number }[]).reduce((acc, curr) => acc + curr.plays, 0) || 4112}회
            </span>
          </div>

        </div>
      </nav>

      {/* 2. Floating Aesthetic Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-48 left-10 text-6xl opacity-10 animate-float-slow select-none">🎈</div>
        <div className="absolute top-1/3 right-12 text-7xl opacity-10 animate-float-medium select-none">🚀</div>
        <div className="absolute bottom-1/4 left-1/4 text-6xl opacity-10 animate-float-fast select-none">🦖</div>
        <div className="absolute top-2/3 right-1/4 text-5xl opacity-10 animate-float-slow select-none">🐱</div>
        <div className="absolute top-28 left-1/3 text-4xl opacity-10 animate-float-medium select-none">⭐</div>
      </div>

      {/* 3. Hero Section (Apple Style + Cute) */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-12 z-10 text-center">
        
        {/* Intro Tag */}
        <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold py-1 px-3.5 rounded-full mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-rose-500" />
          <span>2026 우리 반 어린이 예술제 특별 전시관</span>
        </div>

        {/* Big Main Apple Copy */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto mb-5">
          우리 반 <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 bg-clip-text text-transparent">게임 아케이드</span> 🎮
        </h1>

        {/* Sub Copy */}
        <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 font-medium">
          초등학교 2학년, 4학년 꼬마 개발자들이 오직 상상력과 동심으로 기획하고 그린 6가지 테마의 완전 플레이 가능한 리얼 아케이드 게임 세계로 여러분을 초대합니다!
        </p>

        {/* Dynamic Search & Filter Controls Group */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-3 shadow-lg border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between mb-8">
          
          {/* Active Grade pills */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-full w-full md:w-auto">
            <button
              onClick={() => { setActiveGrade('all'); playSound('jump'); }}
              className={`flex-1 md:flex-none px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeGrade === 'all' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              전체 작품 ({gamesData.length})
            </button>
            <button
              onClick={() => { setActiveGrade('2'); playSound('jump'); }}
              className={`flex-1 md:flex-none px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeGrade === '2' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3 h-3 text-indigo-500" />
              2학년 작품
            </button>
            <button
              onClick={() => { setActiveGrade('4'); playSound('jump'); }}
              className={`flex-1 md:flex-none px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeGrade === '4' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3 h-3 text-emerald-500" />
              4학년 작품
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72 flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="게임명, 제작자 또는 키워드 검색..."
              className="w-full pl-11 pr-4 py-2 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-400 bg-[#FBFBFD]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                지우기
              </button>
            )}
          </div>

        </div>

        {/* Live News Ticker Stripe */}
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-4 py-1.5 font-medium shadow-2xs">
          <Award className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
          <span>인기 급상승작: </span>
          <span className="font-bold text-slate-800">"엄마 몰래 사탕 먹기 🍬"</span>
          <span className="text-slate-300">|</span>
          <span>지금 플레이하여 꼬마 천재들의 꿈을 키워주세요!</span>
        </div>

      </section>

      {/* 4. Game Gallery Section (Grid Layout) */}
      <section className="max-w-7xl mx-auto px-6 pb-24 z-10 relative">
        {filteredGames.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-16 text-center shadow-xs">
            <span className="text-4xl mb-4 block select-none">🧐</span>
            <h3 className="text-lg font-bold text-slate-800 mb-1">일치하는 게임을 찾지 못했어요</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              철자를 다시 확인하거나 다른 검색어를 입력해 보세요. 학년 필터가 켜져 있는지 확인해 주세요!
            </p>
            <button 
              onClick={() => { setActiveGrade('all'); setSearchQuery(''); playSound('jump'); }}
              className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGames.map((game, index) => {
              const stats = gameStats[game.id] || { likes: 0, plays: 0 };
              const userHasLiked = localStorage.getItem(`liked-flag-${game.id}`) === 'true';

              return (
                <div 
                  key={game.id}
                  onClick={() => handleLaunchGame(game)}
                  className={`group relative bg-white border rounded-[32px] overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2.5 hover:shadow-2xl hover:shadow-black/5 ${game.color}`}
                >
                  
                  {/* Top Thumbnail Box with Gradient & Giant Emoji */}
                  <div className="relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden border-b border-black/5">
                    
                    {/* Decorative abstract micro elements to make it "Apple-style" */}
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/20 blur-xl"></div>
                    <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-white/10 blur-lg"></div>
                    
                    {/* Grade Badge */}
                    <span className="absolute top-4 left-4 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm bg-white/90 text-slate-800">
                      {game.grade}학년 작품
                    </span>

                    {/* Likes Quick indicator */}
                    <button 
                      onClick={(e) => handleLike(e, game.id)}
                      className={`absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-xs text-[10px] font-bold transition-all ${
                        userHasLiked 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-white/90 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${userHasLiked ? 'fill-current' : ''}`} />
                      <span>{stats.likes}</span>
                    </button>

                    {/* Floating Center Emoji - triggers subtle scale up on hover */}
                    <div className="text-7xl filter drop-shadow-md select-none transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">
                      {game.emoji}
                    </div>

                    {/* Developer notes small overlay tag */}
                    <div className="absolute bottom-3 left-4 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md text-[9px] text-white/90 font-medium">
                      💡 {game.creator}의 우주띵작
                    </div>
                  </div>

                  {/* Middle Text Content */}
                  <div className="p-6 bg-white/80 backdrop-blur-sm flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                          {game.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">{game.creator}</span>
                        <span>기획 및 개발</span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed mb-5 font-medium line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    <div>
                      {/* Tags row */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {game.tags.map(tag => (
                          <span 
                            key={tag}
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${game.badgeColor}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Lower Play counts and CTA trigger button */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="text-[10px] text-slate-400 font-medium">
                          <span>누적 플레이 </span>
                          <span className="font-display font-semibold text-slate-600">{stats.plays}회</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 group-hover:bg-rose-500 group-hover:text-white rounded-full py-1.5 px-4 transition-all">
                          <span>Play Now</span>
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Heartwarming Encouragement Banner */}
      <section className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden z-10">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-4xl mb-4 block select-none">🎨</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            어린이들의 반짝이는 아이디어가 실제 코드가 되기까지
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-8">
            아이들이 기획하고 직접 그린 종이 스케치 원고를 기반으로 제작된 게임들입니다. 서툴지만 세상에서 가장 아름다운 동심의 발상을 마우스 클릭과 자판 키보드로 직접 누려보고, 아이들에게 칭찬의 글을 남겨주세요!
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1">✨ 무해한 무폭력성 힐링 게임</span>
            <span>✨ 8비트 사운드 이펙트 탑재</span>
            <span>✨ 모바일 & 테블릿 완벽 조작 지원</span>
          </div>
        </div>
      </section>

      {/* 6. Simple Neat Footer */}
      <footer className="bg-white border-t border-black/5 py-12 px-6 text-center relative z-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span>🎮 우리 반 게임 아케이드</span>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] text-slate-400">2026 가을 예술제 한정 특별관</span>
          </div>
          
          <p className="text-[11px] leading-relaxed">
            © 2026 우리 반 꼬마 개발자들. All rights reserved.
          </p>

          <div className="text-[10px] text-slate-400">
            기획자: 김민우, 이서현, 박준서, 최유진, 정태양, 윤동규
          </div>
        </div>
      </footer>

      {/* 7. Active Playable Emulator Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameEmulator 
            game={selectedGame} 
            onClose={() => setSelectedGame(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
