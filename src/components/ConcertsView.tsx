import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Star, MapPin, Calendar, Mic2, Youtube, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { Era } from '../types';

export interface Concert {
  id: string;
  date: string;
  venue: string;
  city: string;
  era: string;
  supportActs: string;
  setlistNotes: string;
  youtubeUrl: string;
  rating: number;
  notes: string;
}

const STORAGE_KEY = 'yzygold_concerts';

function loadConcerts(): Concert[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveConcerts(concerts: Concert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(concerts));
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

const emptyForm = (): Omit<Concert, 'id'> => ({
  date: '',
  venue: '',
  city: '',
  era: '',
  supportActs: '',
  setlistNotes: '',
  youtubeUrl: '',
  rating: 0,
  notes: '',
});

interface ConcertFormProps {
  initial?: Omit<Concert, 'id'>;
  eras: Era[];
  onSave: (data: Omit<Concert, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

function ConcertForm({ initial, eras, onSave, onCancel, title }: ConcertFormProps) {
  const [form, setForm] = useState<Omit<Concert, 'id'>>(initial ?? emptyForm());

  const set = (key: keyof typeof form, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-[#0e0e0e] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Date + Rating row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Rating</label>
              <div className="flex items-center gap-1 h-[34px]">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('rating', form.rating === n ? 0 : n)}
                    className="transition-colors"
                    style={{ color: n <= form.rating ? 'var(--theme-color)' : 'rgba(255,255,255,0.2)' }}
                  >
                    <Star className="w-5 h-5" fill={n <= form.rating ? 'var(--theme-color)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={e => set('venue', e.target.value)}
              placeholder="e.g. Madison Square Garden"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* City */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="e.g. New York, NY"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Era */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Era / Tour</label>
            <select
              value={form.era}
              onChange={e => set('era', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
              style={{ backgroundImage: 'none' }}
            >
              <option value="" className="bg-[#111]">— Select an era —</option>
              {eras.map(era => (
                <option key={era.name} value={era.name} className="bg-[#111]">{era.name}</option>
              ))}
            </select>
          </div>

          {/* Support Acts */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Support Acts</label>
            <input
              type="text"
              value={form.supportActs}
              onChange={e => set('supportActs', e.target.value)}
              placeholder="e.g. Travis Scott, Playboi Carti"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Setlist Notes */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Setlist Notes</label>
            <textarea
              value={form.setlistNotes}
              onChange={e => set('setlistNotes', e.target.value)}
              placeholder="Songs performed, order, notable moments..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* YouTube */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">YouTube Link</label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={e => set('youtubeUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Personal Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="How was it? What stood out?"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/8 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-semibold uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!form.venue && !form.date) return;
              onSave(form);
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            style={{ backgroundColor: 'var(--theme-color)', color: '#000' }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ConcertsViewProps {
  searchQuery: string;
  eras: Era[];
}

export function ConcertsView({ searchQuery, eras }: ConcertsViewProps) {
  const [concerts, setConcerts] = useState<Concert[]>(loadConcerts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { saveConcerts(concerts); }, [concerts]);

  const filtered = concerts.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q || c.venue.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.era.toLowerCase().includes(q) || c.supportActs.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = (data: Omit<Concert, 'id'>) => {
    setConcerts(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    setShowForm(false);
  };

  const handleEdit = (data: Omit<Concert, 'id'>) => {
    setConcerts(prev => prev.map(c => c.id === editingId ? { ...data, id: c.id } : c));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setConcerts(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const editingConcert = editingId ? concerts.find(c => c.id === editingId) : null;

  return (
    <motion.div
      key="concerts"
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="px-4 md:px-8 py-8 pb-32 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">Concerts</h1>
          <p className="text-xs text-white/30 mt-0.5">{concerts.length} show{concerts.length !== 1 ? 's' : ''} logged</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--theme-color)', color: '#000' }}
        >
          <Plus className="w-4 h-4" />
          Add Show
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-24 text-white/25 text-sm">
          {searchQuery ? 'No concerts match your search.' : 'No shows logged yet. Add your first one!'}
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((concert, i) => {
          const ytId = getYouTubeId(concert.youtubeUrl);
          const isExpanded = expandedId === concert.id;

          return (
            <motion.div
              key={concert.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden"
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : concert.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{concert.venue || 'Unknown Venue'}</span>
                    {concert.city && (
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <MapPin className="w-3 h-3" />{concert.city}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {concert.date && (
                      <span className="flex items-center gap-1 text-[11px] text-white/35">
                        <Calendar className="w-3 h-3" />{formatDisplayDate(concert.date)}
                      </span>
                    )}
                    {concert.era && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded border border-white/10 text-white/40 font-medium truncate max-w-[140px]">
                        {concert.era}
                      </span>
                    )}
                    {concert.supportActs && (
                      <span className="flex items-center gap-1 text-[11px] text-white/35 truncate max-w-[160px]">
                        <Mic2 className="w-3 h-3" />{concert.supportActs}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {concert.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star
                          key={n}
                          className="w-3 h-3"
                          style={{ color: n <= concert.rating ? 'var(--theme-color)' : 'rgba(255,255,255,0.15)' }}
                          fill={n <= concert.rating ? 'var(--theme-color)' : 'none'}
                        />
                      ))}
                    </div>
                  )}
                  {ytId && <Youtube className="w-4 h-4 text-red-400/70" />}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                      {concert.setlistNotes && (
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Setlist Notes</div>
                          <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{concert.setlistNotes}</p>
                        </div>
                      )}

                      {concert.notes && (
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Notes</div>
                          <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{concert.notes}</p>
                        </div>
                      )}

                      {ytId && (
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Show Recording</div>
                          <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={`https://www.youtube.com/embed/${ytId}`}
                              title="Concert recording"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(concert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white/50 border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        {deleteConfirmId === concert.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Sure?</span>
                            <button
                              onClick={() => handleDelete(concert.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(concert.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white/30 border border-white/5 hover:text-red-400 hover:border-red-400/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {(showForm || editingId) && (
          <ConcertForm
            key={editingId ?? 'new'}
            title={editingId ? 'Edit Show' : 'Log a Show'}
            eras={eras}
            initial={editingConcert ? { ...editingConcert } : undefined}
            onSave={editingId ? handleEdit : handleAdd}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
