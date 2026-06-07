import { motion, AnimatePresence } from 'motion/react';
import { Search, DollarSign, LogIn, LogOut, Settings, Dice5, X, ChevronDown, GanttChart, LayoutGrid, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SiDiscord, SiReddit, SiTiktok } from 'react-icons/si';
import { FilterMenu } from './FilterMenu';
import { SearchFilters } from '../types';
import { useSettings } from '../SettingsContext';
import { activeConfig } from '../artists/activeConfig';
import { GlobalSearchPanel, GlobalSearchResult } from './GlobalSearchPanel';

export type Category = 'music' | 'art' | 'recent' | 'stems' | 'misc' | 'fakes' | 'related' | 'settings' | 'history' | 'tracklists' | 'released' | 'yedits' | 'comps' | 'videos' | 'playlists' | 'subalbums' | 'concerts' | 'production' | 'contributor';

const DATA_DRIVEN_TABS = new Set(['art', 'stems', 'misc', 'fakes', 'videos', 'tracklists', 'subalbums']);

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  onHomeClick: () => void;
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onRandomSongClick?: () => void;
  isRandomMode?: boolean;
  isTimelineMode?: boolean;
  onTimelineToggle?: () => void;
  yeiOpen: boolean;
  onYEIClick: () => void;
  globalSearchResults?: GlobalSearchResult[];
  onSelectGlobalResult?: (result: GlobalSearchResult) => void;
  fetchedTabs?: Set<string>;
  tabsWithData?: Set<string>;
}

const NAV_CATEGORIES: { key: Category; label: string }[] = [
  { key: 'music', label: 'Music' },
  { key: 'art', label: 'Art' },
  { key: 'stems', label: 'Stems' },
  { key: 'misc', label: 'Misc' },
  { key: 'fakes', label: 'Fakes' },
  { key: 'released', label: 'Released' },
  { key: 'related', label: 'Related' },
  { key: 'recent', label: 'Recent' },
  { key: 'tracklists', label: 'Tracklists' },
  { key: 'yedits', label: 'Yedit Affiliates' },
  { key: 'comps', label: 'Comps' },
  { key: 'videos', label: 'Videos' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'subalbums', label: 'Sub Albums' },
  { key: 'concerts', label: 'Concerts' },
  { key: 'production', label: 'Production Projects' },
];

export function Navbar({ searchQuery, setSearchQuery, filters, setFilters, onHomeClick, activeCategory, onCategoryChange, onRandomSongClick, isRandomMode, isTimelineMode, onTimelineToggle, yeiOpen, onYEIClick, globalSearchResults, onSelectGlobalResult, fetchedTabs, tabsWithData }: NavbarProps) {
  const { settings } = useSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideMobile = mobileDropdownRef.current?.contains(target);
      const insideDesktop = desktopDropdownRef.current?.contains(target);
      if (!insideMobile && !insideDesktop) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const baseCategories = activeConfig.productionFirst
    ? [
        NAV_CATEGORIES.find(c => c.key === 'production')!,
        ...NAV_CATEGORIES.filter(c => c.key !== 'production'),
      ]
    : NAV_CATEGORIES;

  const visibleCategories = baseCategories.filter(({ key }) => {
    if (key === 'yedits' && !activeConfig.hasYeditsTab) return false;
    if (key === 'production' && !activeConfig.hasProductionTab) return false;
    if (key === 'concerts' && !activeConfig.hasConcertsTab) return false;
    if (key === 'comps' && !activeConfig.hasCompsTab) return false;
    if (DATA_DRIVEN_TABS.has(key) && fetchedTabs?.has(key) && !tabsWithData?.has(key)) return false;
    return true;
  });
  const activeLabel = visibleCategories.find(c => c.key === activeCategory)?.label ?? 'Navigate';

  const handleCategoryClick = (cat: Category) => {
    onCategoryChange(cat);
    if (cat === 'settings') {
      setSearchQuery('');
    }
  };

  return (
    <header className="h-auto md:h-16 w-full glass-panel border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 z-30 relative shrink-0 gap-3 md:gap-0">
      <div className="flex flex-col w-full md:flex-1">
        <div className="flex-1 flex flex-row items-center justify-between md:justify-start w-full relative gap-3">
          <div className="md:hidden flex items-center shrink-0">
            <img
              src={activeConfig.logoUrl || '/logo.png'}
              alt={activeConfig.SITE_NAME}
              onClick={onHomeClick}
              className="h-[48px] w-[160px] object-contain object-left cursor-pointer hover:opacity-80 transition-opacity duration-300"
            />
          </div>

          {activeCategory !== 'history' && (
            <div className="hidden md:flex items-center gap-2 flex-1">
              <div className="relative group flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder={activeCategory === 'settings' ? "Search settings..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchFocused(false); }}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-1 pl-8 pr-7 text-xs text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <AnimatePresence>
                  {isSearchFocused && activeCategory !== 'settings' && globalSearchResults && globalSearchResults.length > 0 && (
                    <GlobalSearchPanel
                      results={globalSearchResults}
                      query={searchQuery}
                      onSelect={(result) => {
                        setIsSearchFocused(false);
                        onSelectGlobalResult?.(result);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden md:block w-[170px] h-[60px] shrink-0 overflow-hidden">
                <img
                  src={activeConfig.logoUrl || '/logo.png'}
                  alt={activeConfig.SITE_NAME}
                  onClick={onHomeClick}
                  className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity duration-300"
                  style={{ objectPosition: 'left center' }}
                />
              </div>
            </div>
          )}

          {activeCategory !== 'history' && (
            <div className="md:hidden flex items-center gap-2">
              {activeCategory !== 'art' && activeCategory !== 'settings' && <FilterMenu filters={filters} setFilters={setFilters} activeCategory={activeCategory} />}
              {activeCategory === 'music' && onRandomSongClick && settings.showRandomSongButton && (
                <button
                  onClick={onRandomSongClick}
                  title="Play Random Song"
                  className={`flex items-center justify-center cursor-pointer transition-colors p-1.5 rounded-md border ${isRandomMode ? 'border-[var(--theme-color)] bg-white/10' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                  style={isRandomMode ? { color: 'var(--theme-color)' } : {}}
                >
                  <Dice5 className="w-4 h-4" />
                </button>
              )}
              {activeCategory === 'music' && onTimelineToggle && (
                <button
                  onClick={onTimelineToggle}
                  title={isTimelineMode ? 'Switch to Grid' : 'Switch to Timeline'}
                  className={`flex items-center justify-center cursor-pointer transition-colors p-1.5 rounded-md border ${isTimelineMode ? 'border-[var(--theme-color)] bg-white/10' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                  style={isTimelineMode ? { color: 'var(--theme-color)' } : {}}
                >
                  {isTimelineMode ? <LayoutGrid className="w-4 h-4" /> : <GanttChart className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
        </div>

        {activeCategory !== 'history' && (
          <div className="md:hidden w-full mt-2">
            <div className="relative group w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder={activeCategory === 'settings' ? "Search settings..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchFocused(false); }}
                className="w-full bg-white/5 border border-white/10 rounded-md py-1 pl-8 pr-7 text-xs text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <AnimatePresence>
                {isSearchFocused && activeCategory !== 'settings' && globalSearchResults && globalSearchResults.length > 0 && (
                  <GlobalSearchPanel
                    results={globalSearchResults}
                    query={searchQuery}
                    onSelect={(result) => {
                      setIsSearchFocused(false);
                      onSelectGlobalResult?.(result);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div
          className="md:hidden w-full flex flex-wrap gap-x-4 gap-y-2 items-center"
          style={{ marginTop: '12px' }}
        >
          {settings.dropdownNav ? (
            <div className="relative w-full" ref={mobileDropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-white/10"
                style={dropdownOpen ? { borderColor: 'var(--theme-color)', color: 'var(--theme-color)' } : {}}
              >
                <span>{activeLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-lg overflow-hidden shadow-xl"
                  >
                    {visibleCategories.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { handleCategoryClick(key); setDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${activeCategory === key ? 'text-[var(--theme-color)] bg-[var(--theme-color)]/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            visibleCategories.map(({ key, label }) => (
              <div className="relative" key={key}>
                <button
                  onClick={() => handleCategoryClick(key)}
                  className={`text-xs font-semibold uppercase tracking-widest pb-1 transition-all duration-300 cursor-pointer ${activeCategory === key ? 'text-[var(--theme-color)]' : 'text-white/50 hover:text-white'}`}
                >
                  {label}
                </button>
                {activeCategory === key && (
                  <motion.div layoutId="nav-indicator-mobile" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--theme-color)]" />
                )}
              </div>
            ))
          )}
          <div className="flex items-center gap-4 w-full border-t border-white/10 pt-3 mt-1">
            <button onClick={() => handleCategoryClick('settings')} className={`flex items-center p-2.5 rounded-full transition-all bg-white/5 text-white/50 hover:bg-white/10 hover:text-white ${activeCategory === 'settings' ? 'text-white bg-white/10' : ''}`}>
               <Settings className="w-5 h-5" />
            </button>
            <a
              href="https://discord.gg/xYhKgCDX8h"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: 'rgba(88, 101, 242, 0.15)', color: '#5865F2' }}
              title="Join Discord"
            >
              <SiDiscord className="w-5 h-5" />
            </a>
            <a
              href="https://www.reddit.com/r/2YZY2GOLD/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 69, 0, 0.15)', color: '#FF4500' }}
              title="Reddit"
            >
              <SiReddit className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/t/ZTBerQPF2/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
              title="TikTok"
            >
              <SiTiktok className="w-5 h-5" />
            </a>
            <a
              href="https://vaultgold.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}
              title="VAULTgold"
            >
              <DollarSign className="w-5 h-5" />
            </a>
            <a
              href="https://vaultgold.net/account"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: 'rgba(212, 175, 55, 0.25)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.4)' }}
              title="Create a VAULTgold Account"
            >
              <UserPlus className="w-5 h-5" />
            </a>
            <button
              onClick={onYEIClick}
              className={`flex items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer overflow-hidden ${
                yeiOpen ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
              }`}
              title="Ask YE-I"
            >
              <img src="https://i.ibb.co/TMFsFsSp/YE-I-01.png" alt="YE-I" className="w-5 h-5 rounded-full object-cover" />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-4">
            {activeCategory !== 'art' && activeCategory !== 'settings' && activeCategory !== 'history' && <FilterMenu filters={filters} setFilters={setFilters} activeCategory={activeCategory} />}
            {activeCategory === 'music' && onRandomSongClick && settings.showRandomSongButton && (
              <button
                onClick={onRandomSongClick}
                title="Play Random Song"
                className={`flex items-center justify-center cursor-pointer transition-colors p-1.5 rounded-md border ${isRandomMode ? 'border-[var(--theme-color)] bg-white/10' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                style={isRandomMode ? { color: 'var(--theme-color)' } : {}}
              >
                <Dice5 className="w-4 h-4" />
              </button>
            )}
            {activeCategory === 'music' && onTimelineToggle && (
              <button
                onClick={onTimelineToggle}
                title={isTimelineMode ? 'Switch to Grid' : 'Switch to Timeline'}
                className={`flex items-center justify-center cursor-pointer transition-colors p-1.5 rounded-md border ${isTimelineMode ? 'border-[var(--theme-color)] bg-white/10' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                style={isTimelineMode ? { color: 'var(--theme-color)' } : {}}
              >
                {isTimelineMode ? <LayoutGrid className="w-4 h-4" /> : <GanttChart className="w-4 h-4" />}
              </button>
            )}
          </div>
          {settings.dropdownNav ? (
            <div className="relative" ref={desktopDropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-white/10 whitespace-nowrap"
                style={dropdownOpen ? { borderColor: 'var(--theme-color)', color: 'var(--theme-color)' } : {}}
              >
                <span>{activeLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[180px]"
                  >
                    {visibleCategories.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { handleCategoryClick(key); setDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${activeCategory === key ? 'text-[var(--theme-color)] bg-[var(--theme-color)]/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-6 min-w-max">
              {visibleCategories.map(({ key, label }) => (
                <div className="relative" key={key}>
                  <button
                    onClick={() => handleCategoryClick(key)}
                    className={`text-sm font-semibold uppercase tracking-widest pb-1.5 transition-all duration-300 cursor-pointer whitespace-nowrap ${activeCategory === key ? 'text-[var(--theme-color)]' : 'text-white/50 hover:text-white'}`}
                  >
                    {label}
                  </button>
                  {activeCategory === key && (
                    <motion.div layoutId="nav-indicator-desktop" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--theme-color)]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 hidden md:flex justify-end items-center gap-2 md:gap-3">
        <a
          href="https://discord.gg/xYhKgCDX8h"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-105"
          style={{ backgroundColor: 'rgba(88, 101, 242, 0.15)', color: '#5865F2' }}
          title="Join Discord"
        >
          <SiDiscord className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Discord</span>
        </a>
        <a
          href="https://www.reddit.com/r/2YZY2GOLD/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-105"
          style={{ backgroundColor: 'rgba(255, 69, 0, 0.15)', color: '#FF4500' }}
          title="Reddit"
        >
          <SiReddit className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Reddit</span>
        </a>
        <a
          href="https://www.tiktok.com/t/ZTBerQPF2/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-105"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
          title="TikTok"
        >
          <SiTiktok className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">TikTok</span>
        </a>
        <a
          href="https://vaultgold.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-105"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}
          title="VAULTgold"
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Other Artist Trackers</span>
        </a>
        <a
          href="https://vaultgold.net/account"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer hover:scale-105"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.25)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.4)' }}
          title="Create a VAULTgold Account"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Create Account</span>
        </a>
        <button
          onClick={onYEIClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            yeiOpen
              ? 'bg-white/10 text-white hover:bg-white/15 hover:scale-105'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-105'
          }`}
          title="Ask YE-I"
        >
          <img src="https://i.ibb.co/TMFsFsSp/YE-I-01.png" alt="YE-I" className="w-4 h-4 rounded-full object-cover" />
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">YE-I</span>
        </button>
        <button
          onClick={() => {
            onCategoryChange('settings');
            setSearchQuery('');
          }}
          className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${activeCategory === 'settings' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-110'}`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
