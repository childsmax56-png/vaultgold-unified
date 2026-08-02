import { motion } from 'motion/react';
import { useMemo } from 'react';
import { ExternalLink, CircleDollarSign, CheckCircle2, Clock } from 'lucide-react';
import { formatTextWithTags } from '../utils';
import { SongTitle } from './SongTitle';

export interface Groupbuy {
  era: string;
  name: string;
  content: string;
  price: string;
  start: string;
  end: string;
  type: string;
  status: string;
  link: string;
}

export interface GroupbuyYear {
  year: string;
  total: string;
  buys: Groupbuy[];
}

export interface GroupbuysData {
  years: GroupbuyYear[];
  grandTotal: string;
}

interface GroupbuysViewProps {
  data: GroupbuysData;
  searchQuery: string;
}

// "Info Needed" / "N/A" / "-" / "?" placeholders should render as nothing.
function isPlaceholder(v: string): boolean {
  const s = (v || '').trim().toLowerCase();
  return !s || s === 'n/a' || s === '-' || s === '?' || s === '???' || s === '$???' ||
    s === 'info needed' || s === 'link needed' || s === 'tba' || s === 'unknown';
}

function clean(v: string): string {
  return isPlaceholder(v) ? '' : v.trim();
}

// Add thousands separators to a bare "$12000" style price.
function formatPrice(raw: string): string {
  const v = clean(raw);
  if (!v) return '';
  return v.replace(/\$\s*(\d{4,})(\.\d+)?/g, (_m, digits, dec) =>
    '$' + Number(digits).toLocaleString('en-US') + (dec || ''),
  );
}

function isRealLink(url: string): boolean {
  const u = clean(url).toLowerCase();
  return u.startsWith('http');
}

// A status counts as "completed" for the check badge unless it clearly says otherwise.
function isDone(status: string): boolean {
  const s = clean(status).toLowerCase();
  if (!s) return false;
  if (s.startsWith('no') || s.includes('unfinished') || s === 'false' || s === 'upcoming') return false;
  return s === 'yes' || s === 'true' || s.includes('finished') || s.includes('complete') ||
    s.includes('surfaced') || s.includes('done');
}

function dateRange(start: string, end: string): string {
  const s = clean(start);
  const e = clean(end);
  if (s && e && s !== e) return `${s} → ${e}`;
  return s || e;
}

export function GroupbuysView({ data, searchQuery }: GroupbuysViewProps) {
  const query = searchQuery.trim().toLowerCase();

  const filteredYears = useMemo(() => {
    if (!query) return data.years;
    return data.years
      .map(y => ({
        ...y,
        buys: y.buys.filter(b =>
          b.name.toLowerCase().includes(query) ||
          b.content.toLowerCase().includes(query) ||
          b.era.toLowerCase().includes(query) ||
          y.year.toLowerCase().includes(query),
        ),
      }))
      .filter(y => y.buys.length > 0);
  }, [data.years, query]);

  const totalBuys = useMemo(
    () => data.years.reduce((n, y) => n + y.buys.length, 0),
    [data.years],
  );

  return (
    <motion.div
      key="groupbuys"
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="pb-12"
    >
      {/* Summary header */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Groupbuys</h1>
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Fundraisers
          </span>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          {clean(data.grandTotal) && (
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-white leading-none">{formatPrice(data.grandTotal)}</div>
                <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Total raised</div>
              </div>
            </div>
          )}
          <div>
            <div className="text-2xl font-bold text-white leading-none">{totalBuys.toLocaleString()}</div>
            <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Buys logged</div>
          </div>
        </div>
        <p className="text-white/40 text-sm mt-4 max-w-2xl">
          Community-funded song buys, newest first. Each entry shows what was bought, the amount raised, and when it happened.
        </p>
      </div>

      {/* Timeline grouped by year */}
      <div className="px-4 md:px-8 mt-6 max-w-4xl mx-auto flex flex-col gap-10">
        {filteredYears.map((yearGroup) => (
          <section key={yearGroup.year}>
            <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-yzy-black/90 backdrop-blur-sm flex items-baseline gap-3 border-b border-white/5">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {yearGroup.year}
              </h2>
              {clean(yearGroup.total) && (
                <span className="text-emerald-400 font-semibold text-sm">{formatPrice(yearGroup.total)}</span>
              )}
              <span className="text-white/30 text-xs uppercase tracking-wider ml-auto">
                {yearGroup.buys.length} {yearGroup.buys.length === 1 ? 'buy' : 'buys'}
              </span>
            </div>

            <div className="relative mt-5 pl-6 flex flex-col gap-4">
              {/* vertical timeline rail */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
              {yearGroup.buys.map((buy, i) => {
                const price = formatPrice(buy.price);
                const when = dateRange(buy.start, buy.end);
                const done = isDone(buy.status);
                const status = clean(buy.status);
                const type = clean(buy.type);
                const era = clean(buy.era);
                const content = clean(buy.content);
                const link = isRealLink(buy.link) ? buy.link.trim() : '';
                return (
                  <motion.div
                    key={`${buy.name}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.3 }}
                    className="relative group rounded-lg border border-white/10 hover:border-white/25 bg-white/[0.03] transition-colors"
                  >
                    {/* timeline dot */}
                    <div className={`absolute -left-[22px] top-5 w-3 h-3 rounded-full border-2 ${done ? 'bg-emerald-400 border-emerald-400' : 'bg-yzy-black border-white/40'}`} />
                    <div className="p-4 md:p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-base md:text-lg">
                            <SongTitle name={buy.name} />
                          </div>
                          {era && (
                            <div className="text-white/40 text-xs mt-1">{formatTextWithTags(era)}</div>
                          )}
                        </div>
                        {price && (
                          <div className="shrink-0 text-emerald-400 font-bold text-base md:text-lg">{price}</div>
                        )}
                      </div>

                      {(when || type || status) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {when && <Chip><Clock className="w-3 h-3" /> {when}</Chip>}
                          {type && <Chip>{type}</Chip>}
                          {status && (
                            <Chip className={done ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : ''}>
                              {done && <CheckCircle2 className="w-3 h-3" />} {status}
                            </Chip>
                          )}
                        </div>
                      )}

                      {content && (
                        <p className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap border-l border-white/10 pl-3">
                          {formatTextWithTags(content)}
                        </p>
                      )}

                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-color)]/15 hover:bg-[var(--theme-color)]/25 text-[var(--theme-color)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Snippet
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
        {filteredYears.length === 0 && (
          <div className="text-white/40 text-sm py-12 text-center">No groupbuys match your search.</div>
        )}
      </div>
    </motion.div>
  );
}

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border border-white/10 text-white/60 bg-white/5 whitespace-nowrap inline-flex items-center gap-1 ${className}`}>
      {children}
    </span>
  );
}
