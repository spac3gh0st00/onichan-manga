import { useState, useEffect, useRef, useCallback } from 'react'

const JIKAN   = 'https://api.jikan.moe/v4'
const ANILIST = 'https://graphql.anilist.co'

const GENRE_MAP = {
  'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8,
  'Fantasy': 10, 'Horror': 14, 'Mystery': 7, 'Romance': 22,
  'Sci-Fi': 24, 'Slice of Life': 36, 'Thriller': 41,
  'Supernatural': 37, 'Sports': 30, 'Psychological': 40,
}
const GENRES = Object.keys(GENRE_MAP)

const NAV = [
  { id: 'home',      icon: '⛩',  label: 'Home'         },
  { id: 'popular',   icon: '🔥',  label: 'Popular'      },
  { id: 'new',       icon: '✦',   label: 'New Releases'  },
  { id: 'genres',    icon: '⚡',  label: 'Genres'       },
  { id: 'history',   icon: '📜',  label: 'History'      },
  { id: 'bookmarks', icon: '📌',  label: 'Bookmarks'    },
]

const READ_SITES = [
  { name: 'MangaDex',    color: 'primary',   getUrl: (m) => `https://mangadex.org/search?q=${encodeURIComponent(jTitle(m))}` },
  { name: 'MangaReader', color: 'secondary', getUrl: (m) => `https://mangareader.to/search?keyword=${encodeURIComponent(jTitle(m))}` },
  { name: 'ComicK',      color: 'tertiary',  getUrl: (m) => `https://comick.io/search?q=${encodeURIComponent(jTitle(m))}` },
]

function jCover(m)  { return m?.images?.jpg?.large_image_url || m?.images?.jpg?.image_url || null }
function jTitle(m)  { return m?.title_english || m?.title || 'Unknown' }
function jDesc(m)   { return m?.synopsis || 'No description available.' }
function jTags(m)   { return m?.genres?.map(g => g.name) || [] }
function jStatus(m) { return m?.status || '' }
function jYear(m)   { return m?.published?.from ? new Date(m.published.from).getFullYear() : null }

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

async function jikanFetch(path, params = {}) {
  const q = new URLSearchParams(params)
  const res = await fetch(`${JIKAN}${path}?${q}`)
  if (!res.ok) throw new Error(`Jikan ${res.status}`)
  return (await res.json()).data || []
}

async function anilistFetch(query, variables = {}) {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  return (await res.json()).data
}

const AL_POPULAR = `query($page:Int){Page(page:$page,perPage:24){media(type:MANGA,sort:POPULARITY_DESC,isAdult:false){id title{english romaji}coverImage{large}description genres status startDate{year}siteUrl averageScore}}}`
const AL_SEARCH  = `query($search:String){Page(perPage:12){media(type:MANGA,search:$search,isAdult:false){id title{english romaji}coverImage{large}description genres status startDate{year}siteUrl}}}`
const AL_GENRE   = `query($genre:String){Page(perPage:24){media(type:MANGA,genre:$genre,sort:POPULARITY_DESC,isAdult:false){id title{english romaji}coverImage{large}description genres status startDate{year}siteUrl}}}`

function alNorm(m) {
  return {
    _al: true, al_id: m.id, mal_id: null,
    title: m.title?.english || m.title?.romaji || 'Unknown',
    images: { jpg: { large_image_url: m.coverImage?.large } },
    synopsis: m.description?.replace(/<[^>]+>/g, '') || '',
    genres: (m.genres || []).map(g => ({ name: g })),
    status: m.status,
    score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
    published: { from: m.startDate?.year ? `${m.startDate.year}-01-01` : null },
    siteUrl: m.siteUrl,
  }
}

/* ── Redirect Page ── */
function RedirectPage({ m, onCancel }) {
  const cover = jCover(m)
  useEffect(() => {
    const t = setTimeout(() => {
      window.open(READ_SITES[0].getUrl(m), '_blank')
      onCancel()
    }, 3000)
    return () => clearTimeout(t)
  }, [m, onCancel])

  return (
    <div className="redirect-page">
      <div className="redirect-bg" />
      {cover && <div className="redirect-bg-cover" style={{backgroundImage:`url(${cover})`}} />}
      <div className="redirect-content">
        <span className="redirect-action-word">WHOOSH!</span>
        {cover && (
          <div className="redirect-cover-wrap">
            <img src={cover} className="redirect-cover" alt="" />
            <div className="redirect-cover-badge">Free Read</div>
          </div>
        )}
        <div className="redirect-title">{jTitle(m)}</div>
        <div className="redirect-subtitle">Opening your manga in 3 seconds...</div>
        <div className="redirect-site-btns">
          {READ_SITES.map(s => (
            <a key={s.name} href={s.getUrl(m)} target="_blank" rel="noopener noreferrer"
              className={`redirect-site-btn ${s.color}`}>{s.name} ↗</a>
          ))}
        </div>
        <div className="redirect-bar-wrap"><div className="redirect-bar" /></div>
        <button className="redirect-cancel" onClick={onCancel}>✕ Cancel</button>
      </div>
    </div>
  )
}

/* ── Root App ── */
export default function App() {
  const [page,          setPage]          = useState('home')
  const [popular,       setPopular]       = useState([])
  const [newest,        setNewest]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [apiSource,     setApiSource]     = useState('')
  const [search,        setSearch]        = useState('')
  const [searchRes,     setSearchRes]     = useState([])
  const [searching,     setSearching]     = useState(false)
  const [selected,      setSelected]      = useState(null)
  const [redirect,      setRedirect]      = useState(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [bookmarks,     setBookmarks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('onichan_bm') || '[]') } catch { return [] }
  })
  const [history,       setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('onichan_history') || '[]') } catch { return [] }
  })
  const [activeGenre,   setActiveGenre]   = useState(null)
  const [genreData,     setGenreData]     = useState([])
  const [genreLoading,  setGenreLoading]  = useState(false)
  const [heroIdx,       setHeroIdx]       = useState(0)
  const [error,         setError]         = useState(null)
  const searchTimer = useRef(null)
  const featured = popular.slice(0, 5)

  useEffect(() => { loadHome() }, [])

  async function loadHome() {
    setLoading(true); setError(null)
    try {
      const [pop, neu] = await Promise.all([
        jikanFetch('/top/manga', { type: 'manga', filter: 'bypopularity', limit: 24 }),
        jikanFetch('/manga', { order_by: 'start_date', sort: 'desc', status: 'publishing', limit: 24 }),
      ])
      if (pop.length > 0) {
        setPopular(pop); setNewest(neu); setApiSource('MyAnimeList')
        setLoading(false); return
      }
    } catch (e) { console.warn('Jikan failed', e) }
    try {
      const [p1, p2] = await Promise.all([
        anilistFetch(AL_POPULAR, { page: 1 }),
        anilistFetch(AL_POPULAR, { page: 2 }),
      ])
      setPopular((p1?.Page?.media || []).map(alNorm))
      setNewest((p2?.Page?.media || []).map(alNorm))
      setApiSource('AniList')
    } catch { setError('Could not load manga. Check your connection and retry.') }
    setLoading(false)
  }

  useEffect(() => {
    try { localStorage.setItem('onichan_bm', JSON.stringify(bookmarks)) } catch {}
  }, [bookmarks])

  useEffect(() => {
    try { localStorage.setItem('onichan_history', JSON.stringify(history)) } catch {}
  }, [history])

  useEffect(() => {
    if (featured.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 6000)
    return () => clearInterval(t)
  }, [featured.length])

  const openManga = useCallback((m) => {
    setSelected(m)
    setHistory(prev => {
      const id = m.mal_id || m.al_id
      const filtered = prev.filter(h => (h.mal_id || h.al_id) !== id)
      return [{ ...m, _visitedAt: Date.now() }, ...filtered].slice(0, 50)
    })
  }, [])

  const loadRandom = useCallback(async () => {
    setRandomLoading(true)
    try {
      const pg = Math.floor(Math.random() * 50) + 1
      const res = await jikanFetch('/top/manga', { type: 'manga', page: pg, limit: 25 })
      if (res.length > 0) openManga(res[Math.floor(Math.random() * res.length)])
    } catch {}
    setRandomLoading(false)
  }, [openManga])

  const handleSearch = useCallback((val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchRes([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await jikanFetch('/manga', { q: val, limit: 10 })
        if (res.length > 0) { setSearchRes(res); setSearching(false); return }
      } catch {}
      try {
        const data = await anilistFetch(AL_SEARCH, { search: val })
        setSearchRes((data?.Page?.media || []).map(alNorm))
      } catch {}
      setSearching(false)
    }, 500)
  }, [])

  const loadGenre = useCallback(async (genre) => {
    setActiveGenre(genre); setGenreLoading(true); setGenreData([])
    try {
      const id = GENRE_MAP[genre]
      if (id) {
        const res = await jikanFetch('/manga', { genres: id, order_by: 'popularity', limit: 24 })
        if (res.length > 0) { setGenreData(res); setGenreLoading(false); return }
      }
    } catch {}
    try {
      const data = await anilistFetch(AL_GENRE, { genre })
      setGenreData((data?.Page?.media || []).map(alNorm))
    } catch {}
    setGenreLoading(false)
  }, [])

  const toggleBookmark = useCallback((m) => {
    const id = m.mal_id || m.al_id
    setBookmarks(prev =>
      prev.find(b => (b.mal_id || b.al_id) === id)
        ? prev.filter(b => (b.mal_id || b.al_id) !== id)
        : [...prev, m]
    )
  }, [])

  const isBm = (m) => {
    const id = m.mal_id || m.al_id
    return bookmarks.some(b => (b.mal_id || b.al_id) === id)
  }

  const navigate = (id) => { setPage(id); setSelected(null) }
  const hero = featured[heroIdx]
  const pageData = page === 'popular' ? popular : newest

  return (
    <div className="app-shell">
      {redirect && <RedirectPage m={redirect} onCancel={() => setRedirect(null)} />}

      <div className="action-word action-tl">POW!</div>
      <div className="action-word action-br">SLASH!</div>
      <div className="action-word action-tr">ZAP!</div>

      <nav className="sidebar">
        <div className="logo-wrap">
          <span className="logo-kanji">鬼兄</span>
          <div className="logo-main">ONICHAN</div>
          <div className="logo-sub">SQUAD</div>
        </div>
        <div className="nav-list">
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn${page === n.id ? ' active' : ''}`}
              onClick={() => navigate(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
              {n.id === 'bookmarks' && bookmarks.length > 0 && (
                <span className="nav-badge">{bookmarks.length}</span>
              )}
              {n.id === 'history' && history.length > 0 && (
                <span className="nav-badge" style={{background:'var(--cyan)',color:'#000'}}>{history.length}</span>
              )}
            </button>
          ))}
        </div>
        <button className="random-btn" onClick={loadRandom} disabled={randomLoading}>
          {randomLoading ? '◌ Loading...' : '🎲 Random Manga'}
        </button>
        <div className="sidebar-footer">
          <div>onichan-squad.com · v2.0</div>
          {apiSource && <div style={{fontSize:9,opacity:0.5,marginTop:4}}>via {apiSource}</div>}
        </div>
      </nav>

      <main className="main">
        <div className="search-wrap">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input className="search-input" placeholder="Type a manga title..."
              value={search} onChange={e => handleSearch(e.target.value)} />
            {searching && <span className="search-spinner">◌</span>}
          </div>
          {search && (
            <div className="search-dropdown">
              {searchRes.length === 0 && !searching
                ? <div className="search-empty">No results for "{search}"</div>
                : searchRes.map((m, i) => (
                    <div key={m.mal_id || m.al_id || i} className="search-result"
                      onClick={() => { openManga(m); setSearch(''); setSearchRes([]) }}>
                      {jCover(m) && <img src={jCover(m)} className="search-thumb" alt="" />}
                      <div>
                        <div className="search-name">{jTitle(m)}</div>
                        <div className="search-tags">{jTags(m).slice(0,3).join(' · ')}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {error && (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>{error}<br />
            <button className="btn-primary" style={{marginTop:16}} onClick={loadHome}>Retry</button>
          </div>
        )}

        {/* HOME */}
        {page === 'home' && !selected && !error && (
          <>
            {loading && <div className="skeleton" style={{height:420,marginBottom:44}} />}
            {hero && !loading && (
              <div className="hero">
                {jCover(hero) && <img src={jCover(hero)} className="hero-bg" alt="" />}
                <div className="hero-halftone" />
                <div className="hero-gradient" />
                <div className="hero-content">
                  <div className="hero-eyebrow">✦ FEATURED ✦</div>
                  <h1 className="hero-title">{jTitle(hero)}</h1>
                  <p className="hero-desc">{jDesc(hero).slice(0,200)}…</p>
                  <div className="hero-tags">
                    {jTags(hero).slice(0,5).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div className="hero-actions">
                    <button className="btn-primary" onClick={() => openManga(hero)}>📖 View Details</button>
                    <button className="btn-secondary" onClick={() => setRedirect(hero)}>🚀 Read Free</button>
                  </div>
                </div>
                {jCover(hero) && (
                  <div className="hero-cover-panel">
                    <img src={jCover(hero)} className="hero-cover-img" alt="" />
                  </div>
                )}
                <div className="hero-dots">
                  {featured.map((_, i) => (
                    <div key={i} className={`hero-dot${i === heroIdx ? ' active' : ''}`}
                      onClick={() => setHeroIdx(i)} />
                  ))}
                </div>
              </div>
            )}

            <SectionRow title="🔥 Popular Now" onMore={() => navigate('popular')} loading={loading}>
              {popular.slice(0,8).map((m,i) => (
                <MangaCard key={m.mal_id||m.al_id||i} m={m} onOpen={openManga} onRead={setRedirect} onBm={toggleBookmark} bm={isBm(m)} />
              ))}
            </SectionRow>

            <SectionRow title="✦ New Releases" onMore={() => navigate('new')} loading={loading}>
              {newest.slice(0,8).map((m,i) => (
                <MangaCard key={m.mal_id||m.al_id||i} m={m} onOpen={openManga} onRead={setRedirect} onBm={toggleBookmark} bm={isBm(m)} />
              ))}
            </SectionRow>

            <div className="section-box">
              <div className="section-header">
                <span className="section-title">⚡ Browse by Genre</span>
                <button className="btn-more" onClick={() => navigate('genres')}>All Genres →</button>
              </div>
              <div className="genre-grid">
                {GENRES.map(g => (
                  <button key={g} className="genre-chip"
                    onClick={() => { navigate('genres'); loadGenre(g) }}>{g}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* POPULAR / NEW */}
        {(page === 'popular' || page === 'new') && !selected && (
          <>
            <h2 className="page-title">{page === 'popular' ? '🔥 Popular Manga' : '✦ New Releases'}</h2>
            {loading ? <SkeletonGrid /> : (
              <div className="manga-grid">
                {pageData.map((m,i) => (
                  <MangaCard key={m.mal_id||m.al_id||i} m={m} onOpen={openManga} onRead={setRedirect} onBm={toggleBookmark} bm={isBm(m)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* GENRES */}
        {page === 'genres' && !selected && (
          <>
            <h2 className="page-title">⚡ Browse Genres</h2>
            <div className="genre-grid" style={{marginBottom:28}}>
              {GENRES.map(g => (
                <button key={g} className={`genre-chip${activeGenre === g ? ' active' : ''}`}
                  onClick={() => loadGenre(g)}>{g}</button>
              ))}
            </div>
            {genreLoading && <SkeletonGrid />}
            {!genreLoading && genreData.length > 0 && (
              <div className="manga-grid">
                {genreData.map((m,i) => (
                  <MangaCard key={m.mal_id||m.al_id||i} m={m} onOpen={openManga} onRead={setRedirect} onBm={toggleBookmark} bm={isBm(m)} />
                ))}
              </div>
            )}
            {!activeGenre && (
              <div className="empty-state">
                <span className="empty-icon">⚡</span>Select a genre to explore
              </div>
            )}
          </>
        )}

        {/* HISTORY */}
        {page === 'history' && !selected && (
          <>
            <h2 className="page-title">📜 Reading History</h2>
            {history.length === 0
              ? <div className="history-empty">
                  <span className="empty-icon">📜</span>No history yet — start reading!
                </div>
              : <>
                  <button className="history-clear-btn" onClick={() => setHistory([])}>
                    🗑 Clear History
                  </button>
                  {history.map((m, i) => (
                    <div key={m.mal_id||m.al_id||i} className="history-item" onClick={() => openManga(m)}>
                      {jCover(m) && <img src={jCover(m)} className="history-thumb" alt="" />}
                      <div className="history-info">
                        <div className="history-title">{jTitle(m)}</div>
                        <div className="history-meta">{jTags(m).slice(0,3).join(' · ')}</div>
                      </div>
                      <div className="history-time">{timeAgo(m._visitedAt)}</div>
                    </div>
                  ))}
                </>
            }
          </>
        )}

        {/* BOOKMARKS */}
        {page === 'bookmarks' && !selected && (
          <>
            <h2 className="page-title">📌 Bookmarks</h2>
            {bookmarks.length === 0
              ? <div className="empty-state">
                  <span className="empty-icon">📚</span>No bookmarks yet — go find something epic!
                </div>
              : <div className="manga-grid">
                  {bookmarks.map((m,i) => (
                    <MangaCard key={m.mal_id||m.al_id||i} m={m} onOpen={openManga} onRead={setRedirect} onBm={toggleBookmark} bm={true} />
                  ))}
                </div>
            }
          </>
        )}

        {/* DETAIL */}
        {selected && (
          <DetailView m={selected} onClose={() => setSelected(null)}
            onBm={toggleBookmark} bm={isBm(selected)} onRead={setRedirect} />
        )}
      </main>
    </div>
  )
}

function SectionRow({ title: t, onMore, loading, children }) {
  return (
    <div style={{marginBottom:40}}>
      <div className="section-header">
        <span className="section-title">{t}</span>
        <button className="btn-more" onClick={onMore}>View All →</button>
      </div>
      {loading
        ? <div className="scroll-row">
            {[...Array(6)].map((_,i) => (
              <div key={i} className="skeleton" style={{width:158,height:260,flexShrink:0}} />
            ))}
          </div>
        : <div className="scroll-row">{children}</div>
      }
    </div>
  )
}

function MangaCard({ m, onOpen, onRead, onBm, bm }) {
  const cover = jCover(m)
  return (
    <div className="card" onClick={() => onOpen(m)}>
      <div className="card-img-wrap">
        {cover
          ? <img src={cover} className="card-img" alt={jTitle(m)} loading="lazy" />
          : <div className="card-img-placeholder">📖</div>
        }
        <div className="card-overlay">
          <button className="card-read-btn" onClick={e => { e.stopPropagation(); onRead(m) }}>
            🚀 Read Free
          </button>
          <button className="card-bm-btn" onClick={e => { e.stopPropagation(); onBm(m) }}>
            {bm ? '✓ Saved' : '+ Save'}
          </button>
        </div>
        {jStatus(m) && <div className="card-status">{jStatus(m)}</div>}
        {m.score && (
          <div style={{position:'absolute',top:6,right:6,background:'#ffe940',color:'#000',
            border:'1.5px solid #000',padding:'2px 6px',fontSize:10,fontWeight:900,
            boxShadow:'1px 1px 0 #000'}}>⭐{m.score}</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{jTitle(m)}</div>
        <div className="card-tags">{jTags(m).slice(0,2).join(' · ')}</div>
      </div>
    </div>
  )
}

function DetailView({ m, onClose, onBm, bm, onRead }) {
  const cover  = jCover(m)
  const tTitle = jTitle(m)
  const malUrl = m.mal_id ? `https://myanimelist.net/manga/${m.mal_id}` : null
  const alUrl  = m.siteUrl || (m.al_id ? `https://anilist.co/manga/${m.al_id}` : null)

  return (
    <div className="detail">
      <button className="back-btn" onClick={onClose}>← Back</button>
      <div className="detail-panel">
        <div className="detail-left">
          {cover && <img src={cover} className="detail-cover" alt={tTitle} />}
          <div className="detail-meta-box" style={{marginTop:18}}>
            {jStatus(m) && <div className="meta-row"><span className="meta-label">Status</span><span className="meta-val">{jStatus(m)}</span></div>}
            {jYear(m)   && <div className="meta-row"><span className="meta-label">Year</span><span className="meta-val">{jYear(m)}</span></div>}
            {m.score    && <div className="meta-row"><span className="meta-label">Score</span><span className="meta-val">⭐ {m.score}</span></div>}
          </div>
          <div style={{marginTop:18,display:'flex',flexDirection:'column',gap:10}}>
            <button className="btn-primary" style={{width:'100%'}} onClick={() => onRead(m)}>
              🚀 Read Free
            </button>
            <button className="btn-secondary" style={{width:'100%'}} onClick={() => onBm(m)}>
              {bm ? '✓ Bookmarked' : '+ Bookmark'}
            </button>
          </div>
        </div>
        <div className="detail-right">
          <h1 className="detail-title">{tTitle}</h1>
          <div className="hero-tags">
            {jTags(m).slice(0,6).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <p className="detail-desc">{jDesc(m)}</p>
          <div style={{marginTop:20}}>
            <div style={{fontFamily:'var(--font-comic)',fontSize:13,letterSpacing:2,
              color:'var(--cyan)',marginBottom:10}}>📖 READ ON:</div>
            <div className="redirect-site-btns" style={{justifyContent:'flex-start'}}>
              {READ_SITES.map(s => (
                <a key={s.name} href={s.getUrl(m)} target="_blank" rel="noopener noreferrer"
                  className={`redirect-site-btn ${s.color}`}>{s.name} ↗</a>
              ))}
            </div>
          </div>
          <div className="detail-links" style={{marginTop:16}}>
            {malUrl && <a href={malUrl} target="_blank" rel="noopener noreferrer" className="ext-link">MyAnimeList ↗</a>}
            {alUrl  && <a href={alUrl}  target="_blank" rel="noopener noreferrer" className="ext-link">AniList ↗</a>}
            <a href={`https://www.google.com/search?q=${encodeURIComponent(tTitle+' manga read online free')}`}
              target="_blank" rel="noopener noreferrer" className="ext-link">Google ↗</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="manga-grid">
      {[...Array(12)].map((_,i) => (
        <div key={i} className="skeleton" style={{height:280}} />
      ))}
    </div>
  )
}
