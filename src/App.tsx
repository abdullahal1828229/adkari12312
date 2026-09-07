import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  Clock3,
  Heart,
  Menu,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { categories, adhkar, type Category, type Dhikr } from '@/data/adhkar';

const queryClient = new QueryClient();

const FAVORITES_KEY = 'wird-favorites';
const COUNTS_KEY = 'wird-counts';
const TASBEEH_KEY = 'wird-tasbeeh-count';

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function IconMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${small ? 'h-9 w-9' : 'h-12 w-12'}`} aria-label="ورد اليوم">
      <span className="absolute inset-0 rotate-45 rounded-[0.9rem] bg-[hsl(var(--accent))]" />
      <span className={`relative z-10 font-serif font-bold leading-none text-[hsl(var(--primary))] ${small ? 'text-lg' : 'text-2xl'}`}>و</span>
    </span>
  );
}

function AppShell() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStored(FAVORITES_KEY, []));
  const [counts, setCounts] = useState<Record<string, number>>(() => readStored(COUNTS_KEY, {}));
  const [tasbeehCount, setTasbeehCount] = useState<number>(() => readStored(TASBEEH_KEY, 0));
  const [showFavorites, setShowFavorites] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    window.localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  }, [counts]);

  useEffect(() => {
    window.localStorage.setItem(TASBEEH_KEY, JSON.stringify(tasbeehCount));
  }, [tasbeehCount]);

  const active = categories.find((category) => category.id === activeCategory) ?? null;

  const searchResults = useMemo(() => {
    const normalized = query.trim();
    if (!normalized && !showFavorites) return [];
    return adhkar.filter((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId);
      const matchesSearch =
        !normalized ||
        [item.text, item.note, item.title, category?.title, category?.description].filter(Boolean).join(' ').includes(normalized);
      const matchesFavorite = !showFavorites || favoriteIds.includes(item.id);
      return matchesSearch && matchesFavorite;
    });
  }, [favoriteIds, query, showFavorites]);

  const visibleDhikr = useMemo(() => {
    if (!activeCategory) return [];
    return adhkar.filter((item) => item.categoryId === activeCategory);
  }, [activeCategory]);

  const chooseCategory = (id: string) => {
    setActiveCategory(id);
    setQuery('');
    setShowFavorites(false);
    window.setTimeout(() => document.getElementById('reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
    setDrawerOpen(false);
  };

  const incrementCount = (item: Dhikr) => {
    setCounts((current) => {
      const value = current[item.id] ?? 0;
      if (value >= item.maxCount) return current;
      return { ...current, [item.id]: value + 1 };
    });
  };

  const resetCount = (item: Dhikr) => {
    setCounts((current) => ({ ...current, [item.id]: 0 }));
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => {
      const isFav = current.includes(id);
      toast({ description: isFav ? 'تم الحذف من المفضلة' : 'تمت الإضافة إلى المفضلة' });
      return isFav ? current.filter((item) => item !== id) : [...current, id];
    });
  };

  const openFavorites = () => {
    setShowFavorites(true);
    setQuery('');
    setActiveCategory(null);
    setDrawerOpen(false);
    window.setTimeout(() => document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  const resetHome = () => {
    setActiveCategory(null);
    setQuery('');
    setShowFavorites(false);
    setDrawerOpen(false);
    setLocation('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div dir="rtl" className="noise-overlay min-h-[100dvh] overflow-x-hidden text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-[4.8rem] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="rounded-full p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))] lg:hidden" data-testid="button-open-menu" aria-label="فتح القائمة">
              <Menu size={21} />
            </button>
            <button onClick={resetHome} className="flex items-center gap-3 text-right" data-testid="button-home-logo" aria-label="العودة إلى الصفحة الرئيسية">
              <IconMark small />
              <span className="leading-tight">
                <span className="block font-serif text-xl font-bold tracking-tight text-[hsl(var(--primary))]">ورد اليوم</span>
                <span className="hidden text-[0.65rem] font-semibold tracking-[0.12em] text-[hsl(var(--muted-foreground))] sm:block">رفيقك كل يوم</span>
              </span>
            </button>
          </div>
          <div className="hidden items-center gap-7 text-sm font-semibold text-[hsl(var(--muted-foreground))] lg:flex">
            <button onClick={resetHome} className="transition hover:text-[hsl(var(--primary))]" data-testid="button-nav-home">الرئيسية</button>
            <button onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })} className="transition hover:text-[hsl(var(--primary))]" data-testid="button-nav-categories">الأوراد</button>
            <button onClick={openFavorites} className="transition hover:text-[hsl(var(--primary))]" data-testid="button-nav-favorites">المفضلة</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openFavorites} className="relative rounded-full p-2.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]" data-testid="button-header-favorites" aria-label="المفضلة">
              <Heart size={19} strokeWidth={1.8} fill={favoriteIds.length ? 'currentColor' : 'none'} />
              {favoriteIds.length > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] font-bold text-[hsl(var(--primary))]" data-testid="status-favorite-count">{favoriteIds.length}</span>}
            </button>
            <button onClick={() => setDrawerOpen(true)} className="hidden rounded-full border border-[hsl(var(--border))] p-2.5 text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.35)] hover:text-[hsl(var(--primary))] lg:flex" data-testid="button-header-settings" aria-label="المزيد">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 pb-16 sm:px-8 lg:px-12">
        <section className="relative grid min-h-[26rem] items-center gap-12 overflow-hidden py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:py-16">
          <div className="pointer-events-none absolute -left-32 top-16 h-64 w-64 rounded-full border border-[hsl(var(--accent)/.45)] opacity-60" />
          <div className="pointer-events-none absolute -left-20 top-28 h-44 w-44 rounded-full border border-[hsl(var(--accent)/.3)] opacity-70" />
          <div className="relative z-10 max-w-2xl text-right reveal-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              <span data-testid="text-tagline">٢٢ بابًا من الذكر والدعاء</span>
            </div>
            <h1 className="max-w-xl font-serif text-[3.4rem] font-bold leading-[1.08] tracking-[-.045em] text-[hsl(var(--primary))] sm:text-6xl lg:text-[4.8rem]" data-testid="text-hero-title">
              لحظة ذكر،<br /><span className="text-[hsl(var(--primary)/.7)]">تغيّر اليوم.</span>
            </h1>
            <p className="mt-6 max-w-md text-[1.05rem] leading-8 text-[hsl(var(--muted-foreground))]" data-testid="text-hero-description">
              مساحة صغيرة تحفظ لك وردك، وتعيدك إلى قلبك كلما ازدحم النهار.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => chooseCategory('sabah')} className="group inline-flex items-center gap-3 rounded-full bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[0_12px_26px_-14px_hsl(var(--primary))] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--primary)/.9)]" data-testid="button-start-reading">
                ابدأ وردك
                <ArrowLeft size={17} className="transition group-hover:-translate-x-1" />
              </button>
              <button onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]" data-testid="button-browse-categories">
                تصفّح الأقسام <ChevronLeft size={16} />
              </button>
            </div>
          </div>
          <div className="relative flex min-h-[18rem] items-center justify-center lg:min-h-[24rem] reveal-up reveal-delay-2">
            <div className="absolute h-64 w-64 rounded-full bg-[hsl(var(--accent)/.2)] blur-3xl" />
            <div className="absolute h-72 w-72 rounded-full border border-[hsl(var(--accent)/.35)] pulse-ring" />
            <div className="absolute h-56 w-56 rounded-full border border-[hsl(var(--primary)/.18)]" />
            <div className="relative flex h-56 w-56 flex-col items-center justify-center rounded-[3rem] border border-[hsl(var(--card)/.9)] bg-[hsl(var(--primary))] shadow-[0_28px_60px_-24px_hsl(var(--primary))] rotate-[-4deg] sm:h-64 sm:w-64">
              <Sparkles size={22} className="mb-4 text-[hsl(var(--accent))]" />
              <p className="font-serif text-3xl font-bold text-[hsl(var(--primary-foreground))]">واذكر ربك</p>
              <p className="mt-2 text-sm text-[hsl(var(--primary-foreground)/.65)]">إذا نسيت</p>
              <div className="mt-5 h-px w-14 bg-[hsl(var(--accent)/.7)]" />
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-1 mb-16" aria-label="البحث">
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 shadow-[0_18px_40px_-32px_hsl(var(--primary))] focus-within:border-[hsl(var(--primary)/.4)]">
            <Search size={20} className="shrink-0 text-[hsl(var(--muted-foreground))]" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setShowFavorites(false); setActiveCategory(null); }} placeholder="ابحث عن ذكر أو دعاء..." className="w-full bg-transparent py-1 text-sm font-medium text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground)/.7)]" data-testid="input-search" />
            {query && <button onClick={() => setQuery('')} className="rounded-full p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid="button-clear-search" aria-label="مسح البحث"><X size={16} /></button>}
          </div>
        </section>

        {(query || showFavorites) && (
          <section id="search-results" className="mb-16 scroll-mt-28 reveal-up" aria-label="نتائج البحث">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-bold tracking-[.15em] text-[hsl(var(--accent-foreground))]">{showFavorites ? 'ذاكرتك' : 'نتائج البحث'}</p>
                <h2 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">{showFavorites ? 'المفضلة' : `ما وجدناه لـ «${query}»`}</h2>
              </div>
              <button onClick={() => { setQuery(''); setShowFavorites(false); }} className="text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="button-close-results">إغلاق</button>
            </div>
            {searchResults.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {searchResults.map((item) => (
                  <DhikrCard
                    key={item.id}
                    item={item}
                    category={categories.find((category) => category.id === item.categoryId)}
                    isFavorite={favoriteIds.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                    count={counts[item.id] ?? 0}
                    onIncrement={incrementCount}
                    onReset={resetCount}
                  />
                ))}
              </div>
            ) : (
              <EmptyState favorites={showFavorites} onBrowse={() => { setShowFavorites(false); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); }} />
            )}
          </section>
        )}

        <section id="categories" className="scroll-mt-28 mb-16 reveal-up reveal-delay-1">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[.16em] text-[hsl(var(--accent-foreground))]">دليلك المختصر</p>
              <h2 className="font-serif text-3xl font-bold text-[hsl(var(--primary))] sm:text-4xl" data-testid="text-categories-title">خذ ما تحتاجه اليوم</h2>
            </div>
            <span className="hidden text-sm text-[hsl(var(--muted-foreground))] sm:block">{categories.length} بابًا للذكر</span>
          </div>
          {!isReady ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><div className="h-40 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" /><div className="h-40 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" /><div className="h-40 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" /><div className="h-40 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" /></div>
          ) : (
            <div className="grid auto-rows-[10.5rem] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category, index) => <CategoryCard key={category.id} category={category} index={index} onChoose={chooseCategory} />)}
            </div>
          )}
        </section>

        {active && (
          <section id="reading" className="mb-16 scroll-mt-28 reveal-up">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <button onClick={() => setActiveCategory(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="button-back-categories"><ChevronLeft size={15} /> كل الأقسام</button>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--accent))]"><active.icon size={21} /></span>
                  <div><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{active.count} ذكرًا</p><h2 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]" data-testid="text-reading-title">{active.title}</h2></div>
                </div>
              </div>
              <p className="max-w-xs text-left text-sm leading-7 text-[hsl(var(--muted-foreground))]">{active.description}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleDhikr.map((item) => (
                <DhikrCard
                  key={item.id}
                  item={item}
                  category={active}
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                  count={counts[item.id] ?? 0}
                  onIncrement={incrementCount}
                  onReset={resetCount}
                />
              ))}
            </div>
          </section>
        )}

        <section id="tasbeeh" className="mb-16 grid scroll-mt-28 gap-5 lg:grid-cols-[1.25fr_.75fr] reveal-up reveal-delay-2">
          <div className="relative overflow-hidden rounded-[2rem] bg-[hsl(var(--primary))] p-7 text-[hsl(var(--primary-foreground))] sm:p-10">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-[hsl(var(--accent)/.35)]" />
            <div className="pointer-events-none absolute -left-5 top-0 h-36 w-36 rounded-full border border-[hsl(var(--accent)/.2)]" />
            <div className="relative z-10 flex flex-col justify-between gap-10 md:flex-row md:items-center">
              <div>
                <div className="mb-5 flex items-center gap-2 text-[hsl(var(--accent))]"><Target size={18} /><span className="text-xs font-bold tracking-[.14em]">مساحة الذكر</span></div>
                <h2 className="font-serif text-4xl font-bold leading-tight sm:text-5xl" data-testid="text-tasbeeh-title">سبّح على مهل.</h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-[hsl(var(--primary-foreground)/.66)]">عدّاد حر لا يتقيد بسقف، إلى جانب أذكار المسبحة المحددة في قسم «تسابيح».</p>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => setTasbeehCount((count) => count + 1)} className="group relative flex h-44 w-44 flex-col items-center justify-center rounded-full border border-[hsl(var(--accent)/.5)] bg-[hsl(var(--primary-foreground)/.06)] transition hover:scale-[1.02] active:scale-95" data-testid="button-tasbeeh-count" aria-label="زيادة عداد التسبيح">
                  <span className="font-serif text-6xl font-bold text-[hsl(var(--accent))]" data-testid="text-tasbeeh-count">{tasbeehCount}</span>
                  <span className="mt-1 text-xs text-[hsl(var(--primary-foreground)/.6)]">اضغط للعد</span>
                  <span className="absolute inset-2 rounded-full border border-dashed border-[hsl(var(--accent)/.25)]" />
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-[hsl(var(--primary-foreground)/.5)]">هدف اليوم ٣٣</span>
                  <button onClick={() => setTasbeehCount(0)} className="inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--accent))] hover:underline" data-testid="button-tasbeeh-reset"><RotateCcw size={13} /> تصفير</button>
                </div>
              </div>
            </div>
          </div>
          <div className="paper-lines flex min-h-[16rem] flex-col justify-between rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 sm:p-9">
            <div>
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Clock3 size={19} /></span>
              <h3 className="font-serif text-2xl font-bold text-[hsl(var(--primary))]">أقرب ما يكون العبد</h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">في كل يوم فرصة صغيرة لتعود. خذ نفساً، وابدأ من حيث أنت.</p>
            </div>
            <button onClick={() => chooseCategory('after-prayer')} className="mt-8 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-sm font-bold text-[hsl(var(--primary))] group" data-testid="button-prayer-reading">أذكار بعد الصلاة <ArrowLeft size={17} className="transition group-hover:-translate-x-1" /></button>
          </div>
        </section>

        <section className="mb-12 grid items-center gap-8 border-y border-[hsl(var(--border))] py-12 md:grid-cols-[.8fr_1.2fr]">
          <div className="flex items-center gap-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]"><ShieldCheck size={19} className="text-[hsl(var(--primary))]" /><span>محفوظة على جهازك، لك وحدك</span></div>
          <blockquote className="font-serif text-2xl font-bold leading-relaxed text-[hsl(var(--primary))] sm:text-3xl" data-testid="text-footer-quote">«واذكر ربك إذا نسيت» <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">— الكهف ٢٤</span></blockquote>
        </section>
      </main>

      {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} onHome={resetHome} onFavorites={openFavorites} onChooseCategory={chooseCategory} activeCategory={activeCategory} />}
      <footer className="border-t border-[hsl(var(--border))] px-5 py-7 text-center text-xs text-[hsl(var(--muted-foreground))] sm:px-8">
        <p className="font-serif text-base font-bold text-[hsl(var(--primary))]">ورد اليوم</p>
        <p className="mt-2">مساحة هادئة لذكرٍ لا ينقطع</p>
      </footer>
    </div>
  );
}

function CategoryCard({ category, index, onChoose }: { category: Category; index: number; onChoose: (id: string) => void }) {
  const Icon = category.icon;
  const palette = ['#e9d9ae', '#d9e3df', '#c9d8c6', '#d5e0e1', '#ead9c4', '#e4c37e', '#e0d6ea', '#d8e6d0'];
  const textPalette = ['#17483e', '#19483d', '#285343', '#28515a', '#654d36', '#5c4424', '#4a3a5c', '#33513a'];
  const bg = palette[index % palette.length];
  const fg = textPalette[index % textPalette.length];
  return (
    <a
      href={`/posts/${category.id}.html`}
      onClick={(event) => {
        event.preventDefault();
        onChoose(category.id);
      }}
      className={`group relative overflow-hidden rounded-[1.7rem] border border-[hsl(var(--border)/.65)] p-5 text-right transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_-20px_hsl(var(--primary))] ${index === 0 ? 'col-span-2 row-span-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]'}`}
      data-testid={`card-category-${category.id}`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 0 ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]' : ''}`} style={index === 0 ? undefined : { backgroundColor: bg, color: fg }}><Icon size={21} strokeWidth={1.8} /></span>
          <span className={`text-[0.68rem] font-semibold ${index === 0 ? 'text-[hsl(var(--primary-foreground)/.55)]' : 'text-[hsl(var(--muted-foreground))]'}`}>{category.count} أذكار</span>
        </div>
        <div>
          <h3 className={`font-serif font-bold ${index === 0 ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{category.title}</h3>
          <p className={`mt-2 max-w-sm text-xs leading-6 ${index === 0 ? 'text-[hsl(var(--primary-foreground)/.64)] sm:text-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{category.description}</p>
        </div>
      </div>
      <ChevronLeft className={`absolute bottom-5 left-5 transition duration-300 group-hover:-translate-x-1 ${index === 0 ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--muted-foreground)/.55)]'}`} size={18} />
      {index === 0 && <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full border border-[hsl(var(--accent)/.25)]" />}
    </a>
  );
}

function DhikrCard({
  item,
  category,
  isFavorite,
  onToggleFavorite,
  count,
  onIncrement,
  onReset,
}: {
  item: Dhikr;
  category?: Category;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  count: number;
  onIncrement: (item: Dhikr) => void;
  onReset: (item: Dhikr) => void;
}) {
  const completed = count >= item.maxCount;
  return (
    <article className="group relative rounded-[1.6rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition hover:border-[hsl(var(--primary)/.25)] hover:shadow-[0_16px_30px_-25px_hsl(var(--primary))]" data-testid={`card-dhikr-${item.id}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-bold text-[hsl(var(--primary))]">تكرار: {item.maxCount}</span>
          {category && <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{category.title}</span>}
        </div>
        <button onClick={() => onToggleFavorite(item.id)} className={`rounded-full p-2 transition ${isFavorite ? 'bg-[hsl(var(--accent)/.2)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground)/.6)] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'}`} data-testid={`button-favorite-${item.id}`} aria-label={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}>
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>
      {item.title && <p className="mb-2 text-xs font-bold text-[hsl(var(--accent-foreground))]">{item.title}</p>}
      <p className="font-serif text-[1.3rem] font-bold leading-[1.9] text-[hsl(var(--primary))]" data-testid={`text-dhikr-${item.id}`}>{item.text}</p>
      {item.note && <div className="mt-4 flex items-start gap-2 text-xs leading-6 text-[hsl(var(--muted-foreground))]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />{item.note}</div>}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
        <button
          onClick={() => onIncrement(item)}
          disabled={completed}
          className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${completed ? 'cursor-default bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/.9)]'}`}
          data-testid={`button-count-${item.id}`}
        >
          <span className="font-serif text-lg">{count}</span>
          <span className="opacity-60">/</span>
          <span className="font-serif text-lg">{item.maxCount}</span>
          <span className="text-xs font-semibold">{completed ? 'مكتمل' : 'اضغط للعدّ'}</span>
        </button>
        <button onClick={() => onReset(item)} className="rounded-2xl border border-[hsl(var(--border))] p-2.5 text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.35)] hover:text-[hsl(var(--primary))]" aria-label="إعادة تعيين العدّاد" data-testid={`button-reset-${item.id}`}>
          <RotateCcw size={16} />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ favorites, onBrowse }: { favorites: boolean; onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] px-6 py-14 text-center" data-testid="empty-search-state">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{favorites ? <Heart size={21} /> : <Search size={21} />}</span>
      <h3 className="font-serif text-xl font-bold text-[hsl(var(--primary))]">{favorites ? 'لم تحفظ شيئاً بعد' : 'لم نعثر على هذا الذكر'}</h3>
      <p className="mt-2 max-w-sm text-sm leading-7 text-[hsl(var(--muted-foreground))]">{favorites ? 'اضغط على علامة القلب بجوار أي ذكر ليظهر هنا، وتعود إليه بسهولة.' : 'جرّب كلمة أقصر، أو تصفّح الأقسام لتجد ما يلامس حاجتك.'}</p>
      <button onClick={onBrowse} className="mt-6 rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5" data-testid="button-empty-browse">تصفّح الأقسام</button>
    </div>
  );
}

function Drawer({ onClose, onHome, onFavorites, onChooseCategory, activeCategory }: { onClose: () => void; onHome: () => void; onFavorites: () => void; onChooseCategory: (id: string) => void; activeCategory: string | null }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة">
      <button onClick={onClose} className="absolute inset-0 bg-[hsl(var(--primary)/.42)] backdrop-blur-sm" data-testid="button-close-menu-overlay" aria-label="إغلاق القائمة" />
      <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-[hsl(var(--card))] p-6 shadow-2xl animate-[reveal-up_280ms_ease-out]" data-testid="mobile-drawer">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3"><IconMark small /><span className="font-serif text-xl font-bold text-[hsl(var(--primary))]">ورد اليوم</span></div>
          <button onClick={onClose} className="rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid="button-close-menu" aria-label="إغلاق القائمة"><X size={19} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pb-24">
          <button onClick={onHome} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]" data-testid="drawer-home"><Sparkles size={18} /> الرئيسية</button>
          <button onClick={onFavorites} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]" data-testid="drawer-favorites"><Heart size={18} /> المفضلة</button>
          <div className="my-5 border-t border-[hsl(var(--border))]" />
          <p className="px-3 pb-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">الأقسام</p>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.id}
                href={`/posts/${category.id}.html`}
                onClick={(event) => {
                  event.preventDefault();
                  onChooseCategory(category.id);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeCategory === category.id ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                data-testid={`drawer-category-${category.id}`}
              >
                <Icon size={17} /> {category.title}
              </a>
            );
          })}
        </nav>
        <div className="absolute bottom-6 right-6 left-6 rounded-2xl bg-[hsl(var(--primary))] p-4 text-[hsl(var(--primary-foreground))]"><p className="text-xs leading-6 text-[hsl(var(--primary-foreground)/.72)]">«ألا بذكر الله تطمئن القلوب»</p></div>
      </aside>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={AppShell} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
