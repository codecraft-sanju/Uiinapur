# UIINAPUR 2.0 — Walk Mode upgrade

This is the existing frontend with an incremental Walk Mode integration. No new dependencies are required. All source files are included, not a hosted-demo link.

## Exact implementation file list

Updated:
- components/uiinapur/App.tsx
- components/uiinapur/World.tsx

New:
- components/uiinapur/WalkExperience.tsx
- components/uiinapur/WalkController.tsx
- components/uiinapur/WalkAvatar.tsx
- components/uiinapur/walk.css
- lib/uiinapur/walk.ts
- scripts/test-walk.mjs
- tests/walk.cjs

Delivery documentation: WALK-MODE-CHANGES.md and COMPLETE-WALK-CODE.md.

## Apply to your existing project

Copy the two updated files and seven new files at their exact paths. The complete standalone project is also included. Keep your existing localStorage; no reset or migration is required. Run `npm run dev` and click “Walk Into Uiinapur” in the explorer.

`data.ts`, `store.ts`, `globals.css`, `package.json` and all other original source files are unchanged. The 495 parcel IDs, seven territories, routes and uiinapur-nation-v1 persistence key are preserved. Walk state is ephemeral and does not enter the persisted store.

## Controls

W/A/S/D walk; Shift runs; Space jumps; drag the world to orbit; scroll zooms; Escape or Exit Walk Mode returns to the captured aerial camera and selection. Mobile uses the joystick, toggle Run and Jump, canvas drag and two-finger pinch.

## Implementation

The existing world mesh supplies ground height and surface normals through raycasts. Coastline and river footprint tests prevent entering water. Substepped gravity, step-height and slope limits follow terrain. Swept horizontal rays handle buildings, trees and monuments; bounding boxes reject spawns inside solids. Camera obstruction rays shorten the follow distance. The articulated procedural avatar animates idle, walking, running and jumping without external assets.

MapControls unmount while the walk controller is mounted. Exit restores the captured aerial position/target through the existing transition. Keyboard, pointer, wheel, blur, visibility and WebGL context listeners are cleaned up. Reduced-motion preferences skip entry animation. Unsupported WebGL retains the existing SVG map and displays a disabled Walk Mode button.

Simulation buffers and Three.js objects intentionally mutate outside React rendering; narrowly documented immutability-lint exceptions cover that imperative integration. No global lint rules were changed.

## Actual validation

- npm run typecheck: PASS
- npm run lint: PASS
- npm test: PASS — existing parcel/economy/authorization/persistence tests, including 495 unique parcels in seven territories.
- node scripts/test-walk.mjs: PASS — normalized camera-relative movement, dry footprint candidates in seven territories, coastline/river rejection, shared internal border traversal, jump/gravity/landing at 20/30/60/120 Hz.
- npm run build: PASS — Next.js production webpack build and all existing routes prerendered.
- Byte comparison: original data.ts, store.ts, globals.css and package.json unchanged; only the two listed original source files changed.

GPU rendering, real-device touch behavior, camera collision edge cases and full interactive spawn/movement across the actual scene were not visually verified in this environment. Unit tests cover movement math and geographic footprints; they do not substitute for a WebGL gameplay test. On a WebGL 2 browser, verify entry/exit from a selected parcel, movement around buildings and slopes, coast/river boundaries, jumping, camera zoom/drag, mobile multitouch and blur/re-entry.

No multiplayer, NPCs, roads, plaza, interiors, building-editor expansion, chat or backend was added. Existing property editing remains as it was.


# Complete copy-paste-ready files


## components/uiinapur/App.tsx

```tsx
'use client';
import { localId } from '@/lib/uiinapur/id';
import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog } from 'radix-ui';
import { ArrowUpRight, ArrowRight, ChevronDown, Globe2, Compass, Search, Plus, RotateCcw, Layers, MapPin, Heart, X, Check, Shield, Building2, Sparkles, Copy, Menu, Flag, User, Maximize, ChevronRight } from 'lucide-react';
import { territories, territory, plots, money, templates, type Plot, type Building } from '@/lib/uiinapur/data';
import { useNation, getPlot } from '@/lib/uiinapur/store';
import FallbackWorld from './FallbackWorld';
import './walk.css';
const BuildingPreview = lazy(() => import('./BuildingPreview'));
const World = lazy(() => import('./WalkExperience'));
const links = [['/', 'Explore'], ['/marketplace', 'Land Exchange'], ['/districts', 'Districts'], ['/events', 'The Republic'], ['/membership', 'Uiiyan+']];
const avatarChoices = ['✦', '◈', '❋', '✺', '⬡', '☾'];
export default function App({ page = 'explore' }: {
    page?: string;
}) {
    const s = useNation();
    const router = useRouter();
    const [ready, setReady] = useState(false), [selected, setSelected] = useState<string | null>(null), [region, setRegion] = useState('all'), [status, setStatus] = useState('all'), [query, setQuery] = useState(''), [view, setView] = useState(0), [fallback, setFallback] = useState(false), [listView, setListView] = useState(false), [modal, setModal] = useState<string | null>(null), [toast, setToast] = useState(''), [mobileMenu, setMobileMenu] = useState(false), [sort, setSort] = useState('featured'), [category, setCategory] = useState('all'), [rarity, setRarity] = useState('all'), [maxPrice, setMaxPrice] = useState(15000), [onlyFav, setOnlyFav] = useState(false), [name, setName] = useState(''), [home, setHome] = useState('AUR'), [avatar, setAvatar] = useState('✦'), [amount, setAmount] = useState(''), [error, setError] = useState(''), [draft, setDraft] = useState<Building>({ template: 'Modern villa', wall: '#a9c8bd', roof: '#315a56', rotation: 0, garden: true }), [district, setDistrict] = useState(''), [venueFilter, setVenueFilter] = useState('All'), [expandedSheet, setExpandedSheet] = useState(false), [passportBack, setPassportBack] = useState(false);
    useEffect(() => { const frame = requestAnimationFrame(() => { useNation.persist.rehydrate(); const canvas = document.createElement('canvas'); if (!canvas.getContext('webgl2'))
        setFallback(true); setReady(true); const p = new URLSearchParams(window.location.search).get('plot'); if (p && plots.some(v => v.id === p))
        setSelected(p); }); return () => cancelAnimationFrame(frame); }, []);
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);
    const items = plots.map(p => ({ ...p, ...s.changes[p.id] }));
    const plot = selected ? getPlot(selected, s) : null;
    const owned = items.filter(p => s.citizen && p.owner === s.citizen.id);
    const currentTerritory = region === 'all' ? null : territory(region);
    function notify(t: string) { setToast(t); }
    function open(m: string) { setError(''); if (m === 'citizen' && s.citizen) {
        setName(s.citizen.name);
        setAvatar(s.citizen.avatar);
    } setModal(m); }
    function choose(id: string) { setSelected(id); if (page === 'explore')
        history.replaceState(null, '', '/?plot=' + id); }
    function changeRegion(id: string) { setSelected(null); setRegion(id); setView(v => v + 1); }
    function share(id: string) { const url = location.origin + '/?plot=' + id; navigator.clipboard?.writeText(url).then(() => notify('Property link copied')).catch(() => { setAmount(url); open('share'); }); }
    function complete(action: () => string | null, msg: string) { const err = action(); if (err)
        setError(err);
    else {
        setModal(null);
        notify(msg);
    } }
    function acquire() { if (!s.citizen) {
        open('citizen');
        return;
    } open('buy'); }
    const filtered = items.filter(p => (region === 'all' || p.territory === region) && p.id.toLowerCase().includes(query.toLowerCase()) && (category === 'all' || p.category === category) && (rarity === 'all' || p.rarity === rarity) && p.price <= maxPrice && (!onlyFav || s.favorites.includes(p.id)) && (status === 'all' || status === 'available' && !p.owner || status === 'owned' && p.owner === s.citizen?.id || status === 'listed' && p.listed)).sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'recent' ? b.id.localeCompare(a.id) : parseInt(a.id.slice(4)) - parseInt(b.id.slice(4)));
    function card(p: Plot) { return <button className="property-card" key={p.id} onClick={() => choose(p.id)}><div className="property-art" style={{ '--land': territory(p.territory).color } as React.CSSProperties}><div className="terrain-tile"><div className="tiny-house"><i /><b /></div><span /><span /><span /></div><span className="rarity">{p.rarity}</span><span className="card-corner"><ArrowUpRight size={16}/></span></div><div className="card-body"><div className="eyebrow">{territory(p.territory).name} <span>· {p.category}</span></div><h3>{p.id} <span>{s.favorites.includes(p.id) ? '♥' : ''}</span></h3><p>{p.area} m² <span> {p.owner === s.citizen?.id ? '◈ Your property' : p.listed ? '↗ Resale listing' : p.owner ? '● Citizen owned' : '◇ Available'}</span></p><div className="card-price">{money(p.price)}<small>ILLUSTRATIVE PRICE</small></div></div></button>; }
    function passport() { return <div className={'passport ' + (passportBack ? 'passport-back' : '')} onClick={() => setPassportBack(!passportBack)} role="button" tabIndex={0} aria-label="Flip fictional passport" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setPassportBack(!passportBack);
    } }}>{passportBack ? <div className="passport-reverse"><span>✳</span><h2>Many stories.<br />One nation.</h2><p>Citizenship is a promise to imagine, create and belong.</p><small>Joined {s.citizen ? new Date(s.citizen.joined).toLocaleDateString('en-IN') : '—'} · {s.membership}</small><p className="eyebrow">FICTIONAL COMMUNITY PASSPORT</p></div> : null}<div className="passport-front"><div className="passport-top"><span>REPUBLIC OF UIINAPUR</span><Globe2 size={20}/></div><div className="passport-emblem">✳</div><p className="eyebrow">A WORLD TO CALL YOURS</p><h2>{s.citizen?.name || 'Future Uiiyan'}</h2><div className="passport-bottom"><div><small>CITIZEN OF</small><strong>{territory(s.citizen?.state || 'AUR').name}</strong></div><div className="citizen-avatar">{s.citizen?.avatar || '✦'}</div></div><div className="passport-number">{s.citizen?.id || 'YOUR STORY STARTS HERE'} <span>FICTIONAL PASSPORT</span></div></div></div>; }
    return <div className={'application ' + (page === 'explore' ? 'explorer-app' : 'content-app')}>
    <header className="topbar"><Link className="brand" href="/" aria-label="Uiinapur home"><span className="brand-emblem">✳</span><span>uiinapur<span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} className={(page === 'explore' ? href === '/' : href === '/' + page) ? 'active' : ''}>{label}{label === 'Uiiyan+' && <span className="tiny-gold">✦</span>}</Link>)}</nav><div className="header-actions"><span className="demo-badge"><i /> DEMO WORLD</span><button className="citizen-button" onClick={() => s.citizen ? router.push('/vault') : open('citizen')}>{s.citizen ? <><span>{s.citizen.avatar}</span> My vault</> : <>Become a citizen <ArrowUpRight size={15}/></>}</button><button className="icon-button mobile-toggle" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21}/></button></div></header>
    {mobileMenu && <div className="mobile-menu">{links.map(([href, label]) => <Link href={href} key={href}>{label}<ArrowUpRight size={16}/></Link>)}<Link href="/vault">My vault</Link></div>}
        {page === 'explore' ? <main className="explorer">
        <div className="world-canvas">{ready && !fallback ? <Suspense fallback={<div className="world-loading"><span className="brand-emblem">✳</span>Mapping a new world…</div>}><World selected={selected} region={region} onSelect={choose} onRegion={changeRegion} view={view} status={status} onFail={() => setFallback(true)}/></Suspense> : fallback ? <><FallbackWorld selected={selected} region={region} onSelect={choose} onRegion={changeRegion} status={status}/><button className="walk-entry" disabled title="Walk Mode requires WebGL 2. The map remains available.">Walk Mode · WebGL 2 required</button></> : <div className="world-loading">Preparing your world…</div>}</div>
        <div className="world-vignette"/>
        <section className="world-intro"><div className="eyebrow"><span className="live-dot"/> AN INTERNET-BORN NATION</div><h1>{currentTerritory ? currentTerritory.name : <>Not just a place.<br />A possibility<span>.</span></>}</h1><p>{currentTerritory ? currentTerritory.subtitle : 'Seven territories. Endless stories. One world to call yours.'}</p><button className="text-link" onClick={() => { s.seen(); changeRegion('AUR'); }}>Enter Uiinapur <ArrowRight size={17}/></button></section>
        <aside className="explorer-tools"><div className="tool-caption">WORLD EXPLORER <span>01 / 07</span></div><div className="search-field"><Search size={16}/><input aria-label="Search plot ID" value={query} onChange={e => { setQuery(e.target.value); setListView(true); }} placeholder="Find your place…"/><kbd>⌕</kbd></div><label className="select-field"><Globe2 size={16}/><select aria-label="Select territory" value={region} onChange={e => changeRegion(e.target.value)}><option value="all">All territories</option>{territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><ChevronDown size={14}/></label><div className="status-options">{[['all', 'All plots'], ['available', 'Available'], ['owned', 'Yours']].map(([value, label]) => <button key={value} className={status === value ? 'selected' : ''} onClick={() => setStatus(value)}>{label}</button>)}</div><button className="browse-toggle" onClick={() => setListView(!listView)}><Layers size={15}/>{listView ? 'Hide plot browser' : 'Browse all parcels'}<ChevronRight size={14}/></button></aside>
        {listView && <div className="plot-browser"><div className="panel-heading"><span>{filtered.length} parcels</span><button className="icon-button" aria-label="Close browser" onClick={() => setListView(false)}><X size={16}/></button></div>{filtered.slice(0, 60).map(p => <button key={p.id} onClick={() => choose(p.id)}><span><i style={{ background: territory(p.territory).color }}/>{p.id}<small>{territory(p.territory).name}</small></span><b>{money(p.price)}<ArrowUpRight size={13}/></b></button>)}{filtered.length > 60 && <p>Use search or territory filters to narrow results.</p>}</div>}
        <div className="world-coordinate"><span>UIINAPUR ARCHIPELAGO</span><small>28° 38′ N &nbsp; 77° 12′ E · FICTIONAL GRID</small></div>
        <div className="map-controls"><span className="compass-mark">N<Compass size={32}/></span><button aria-label="National view" onClick={() => { changeRegion('all'); setSelected(null); }}><Maximize size={18}/></button><button aria-label="Reset camera" onClick={() => setView(v => v + 1)}><RotateCcw size={18}/></button><button aria-label="Toggle plot list" onClick={() => setListView(!listView)}><Layers size={18}/></button></div>
        <div className="world-footer"><span><i className="live-dot"/> SEASON 01 <b>The beginning of everything</b></span><div><span><i className="legend available"/> Available</span><span><i className="legend owned"/> Citizen owned</span><span><i className="legend listed"/> Listed for resale</span></div><span className="gesture-help">Drag to explore <span>·</span> Scroll to discover</span></div>
        {!s.introSeen && ready && <div className="welcome-note"><div><Sparkles size={18}/><span>A nation imagined. A world made yours.<small>Explore freely. Your story can start anywhere.</small></span></div><button onClick={() => { s.seen(); open('citizen'); }}>Get your passport <ArrowUpRight size={15}/></button><button className="icon-button" aria-label="Skip introduction" onClick={s.seen}><X size={16}/></button></div>}
        </main> : <main className="page-content">
        <div className="page-kicker"><span className="live-dot"/> UIINAPUR / {page === 'marketplace' ? 'LAND EXCHANGE' : page.toUpperCase()}</div>
        {page === 'marketplace' && <><div className="page-title"><div><h1>A little land.<br /><em>A lot of possibility.</em></h1><p>Discover your corner of a world built by its people.</p></div><div className="market-stat"><strong>{items.filter(p => !p.owner || p.listed).length.toLocaleString()}</strong><span>PLACES TO BEGIN</span></div></div><div className="market-toolbar"><div className="search-field"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by plot ID" aria-label="Search marketplace"/></div><select aria-label="Filter territory" value={region} onChange={e => setRegion(e.target.value)}><option value="all">All territories</option>{territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select aria-label="Property category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{['Residential', 'Commercial', 'Creative'].map(v => <option key={v}>{v}</option>)}</select><select aria-label="Rarity" value={rarity} onChange={e => setRarity(e.target.value)}><option value="all">All rarities</option>{['Common', 'Rare', 'Legendary'].map(v => <option key={v}>{v}</option>)}</select><button className={'soft-button ' + (onlyFav ? 'active' : '')} onClick={() => setOnlyFav(!onlyFav)}><Heart size={15}/> Watchlist</button></div><div className="results-line"><span>{filtered.length} properties <small>· Illustrative prices / no real payments</small></span><label>Up to {money(maxPrice)} <input type="range" min="1000" max="1000000" step="1000" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} aria-label="Maximum price"/></label><select aria-label="Sort properties" value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Curated for you</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="recent">Plot ID: newest sequence</option></select></div><div className="property-grid">{filtered.slice(0, 48).map(card)}</div>{filtered.length === 0 && <Empty title="No plots found" text="Try a different territory or price range."/>}{filtered.length > 48 && <p className="muted centered">Showing the first 48 matching parcels. Search by plot ID for a specific property.</p>}</>}
        {page === 'vault' && <><div className="page-title"><div><h1>Your place.<br /><em>Your story.</em></h1><p>Everything that makes you a Uiiyan, in one place.</p></div><button className="soft-button" onClick={() => open('reset')}><RotateCcw size={15}/> Reset demo</button></div><div className="vault-intro">{passport()}<div className="vault-summary"><span className="eyebrow">CITIZEN COLLECTION</span><h2>{s.citizen ? 'Welcome home, ' + s.citizen.name : 'Make it official.'}</h2><p>{s.citizen ? 'Your passport is just the beginning. Build something that belongs here.' : 'Choose your state, claim your identity, and start your own story.'}</p><div className="vault-stats"><div><strong>{owned.length}</strong><small>PROPERTIES</small></div><div><strong>{owned.filter(p => p.listed).length}</strong><small>ACTIVE LISTINGS</small></div><div><strong>{s.transactions.length}</strong><small>TRANSACTIONS</small></div></div><button className="primary" onClick={() => open('citizen')}>{s.citizen ? 'Edit citizen profile' : 'Create your passport'}<ArrowRight size={16}/></button><span className="membership-label">✦ {s.membership}</span></div></div><div className="section-title"><h2>My properties <small>{owned.length}</small></h2><Link href="/marketplace">Discover more <ArrowUpRight size={16}/></Link></div>{owned.length ? <div className="property-grid">{owned.map(card)}</div> : <Empty title="Your first chapter is waiting." text="Explore the nation and simulate acquiring a plot. It will appear here with its fictional deed."/>}<div className="section-title"><h2>Pending & recent offers</h2><span className="demo-badge">OWNER SIMULATION</span></div><p className="muted">Use the seller simulation below to accept or reject your pending demo offers. This is not a real owner’s authorization.</p>{s.offers.length ? s.offers.map(o => <div className="activity-row" key={o.id}><div><strong>{o.plot}</strong><small>{money(o.amount)} · {o.status}</small></div>{o.status === 'pending' && <div className="button-row"><button className="soft-button" onClick={() => { const e = s.resolveOffer(o.id, false); notify(e || 'Seller simulation: offer rejected'); }}>Simulate rejection</button><button className="primary" onClick={() => { const e = s.resolveOffer(o.id, true); notify(e || 'Seller simulation: offer accepted and ownership transferred'); }}>Simulate acceptance</button></div>}</div>) : <p className="muted">No offers yet. Make an offer on a resale listing in the Land Exchange.</p>}<div className="section-title"><h2>Transaction history</h2></div>{s.transactions.length ? s.transactions.map(t => <div className="activity-row" key={t.id}><span className="activity-icon"><Check size={18}/></span><div><strong>{t.plot}</strong><small>{new Date(t.date).toLocaleDateString('en-IN')} · Simulated acquisition</small></div><strong>{money(t.amount)}<small>Includes {money(t.fee)} treasury commission</small></strong></div>) : <p className="muted">Your simulated transactions will appear here.</p>}<div className="section-title"><h2>Watchlist</h2></div><div className="property-grid">{items.filter(p => s.favorites.includes(p.id)).map(card)}</div></>}
        {page === 'membership' && <><div className="page-title"><div><h1>Belong a little<br /><em>more brilliantly.</em></h1><p>Express yourself. Support the world. Keep your vote equal.</p></div><Sparkles className="page-symbol"/></div><div className="plan-grid">{[{ name: 'Free Citizen', price: '₹0', desc: 'Every story deserves a beginning.', features: ['Nation exploration', 'Fictional citizenship & passport', 'Free, equal voting', 'Basic building customization'] }, { name: 'Uiiyan+', price: '₹149', desc: 'For those who make a place their own.', features: ['Everything in Free Citizen', 'Premium passport identity', 'Special avatar cosmetics', 'Enhanced property showcases'] }, { name: 'Creator Pro', price: '₹499', desc: 'Turn your imagination into a destination.', features: ['Everything in Uiiyan+', 'Creator application tools', 'Advanced building templates', 'Illustrative venue analytics'] }].map((p, i) => <article className={'plan ' + (i === 1 ? 'featured-plan' : '')} key={p.name}><span className="eyebrow">{i === 1 ? '✦ A LITTLE EXTRAORDINARY' : i === 2 ? 'FOR THE WORLD BUILDERS' : 'YOUR CITIZENSHIP'}</span><h2>{p.name}</h2><p>{p.desc}</p><div className="plan-price">{p.price}<small>{i ? '/ month' : 'forever'}</small></div><ul>{p.features.map(f => <li key={f}><Check size={16}/>{f}</li>)}</ul><button className={i === 1 ? 'primary' : 'soft-button'} onClick={() => { if (!s.citizen) {
            open('citizen');
            return;
        } s.plan(p.name); notify(p.name + ' activated in demo mode'); }}>{s.membership === p.name ? 'Current demo plan' : 'Activate demo plan'}<ArrowRight size={15}/></button></article>)}</div><div className="disclosure"><Shield size={20}/><div><strong>A demonstration, with no strings attached.</strong><p>All prices are illustrative. No payment, billing, subscription, or automatic renewal occurs. Switch to Free Citizen anytime to cancel the simulated upgrade. Membership never changes voting power.</p></div></div></>}
        {page === 'events' && <><div className="page-title"><div><h1>A nation of voices.<br /><em>Yours included.</em></h1><p>Season 01 · The founding season. Fictional politics. Real imagination.</p></div><Flag className="page-symbol"/></div><div className="event-banner"><span className="eyebrow">THE FIRST ASSEMBLY</span><h2>Big ideas. Small rivalries.<br />Absolutely no boring manifestos.</h2><p>Demo elections stay open for exploration. Each citizen gets one vote in their home state.</p><span className="demo-badge">FREE VOTING · NO PAID INFLUENCE</span></div><div className="state-grid">{territories.slice(0, 5).map(t => <article className="state-card" key={t.id} style={{ '--land': t.color } as React.CSSProperties}><div className="state-card-top"><span>◈</span><small>{t.id} / FOUNDING ELECTION</small></div><h2>{t.name}</h2><p>{t.subtitle}</p>{['The Dreamers', 'The Makers'].map((c, i) => <div className="candidate" key={c}><span>{i ? '⌂' : '✦'}</span><div><strong>{c}</strong><small>{i ? 'A studio on every street.' : 'More gardens. Fewer meetings.'}</small></div><button disabled={!!s.votes[t.id]} onClick={() => { if (!s.citizen) {
            open('citizen');
            return;
        } notify(s.vote(t.id, c) ? 'Your free demo vote has been recorded.' : 'You can vote once in your home state.'); }}>{s.votes[t.id] === c ? <Check size={16}/> : s.votes[t.id] ? '—' : 'Vote'}</button></div>)}<div className="vote-result">Local demo votes: {s.votes[t.id] ? '1 · ' + s.votes[t.id] : '0 · Be the first'}<small>No seeded vote totals</small></div></article>)}</div></>}
        {page === 'districts' && <><div className="page-title"><div><h1>Find your people.<br /><em>Make your scene.</em></h1><p>Small corners of the internet. Whole worlds of possibility.</p></div><button className="primary" onClick={() => open('creator')}>Build a district <Plus size={16}/></button></div><div className="district-tabs">{['All', 'Art', 'Music', 'Gaming'].map(v => <button key={v} className={venueFilter === v ? 'selected' : ''} onClick={() => setVenueFilter(v)}>{v}</button>)}</div><div className="district-grid">{[{ name: 'The Afterlight Gallery', type: 'Art', state: 'Aurayarr', icon: '✳', color: '#b4a3db', desc: 'Art that belongs somewhere between the real and the imagined.' }, { name: 'Low Tide Listening Club', type: 'Music', state: 'Fuina', icon: '◉', color: '#72b7c2', desc: 'A place for late-night sounds and people on your frequency.' }, { name: 'Pixel Park', type: 'Gaming', state: 'Pinkyork', icon: '⌘', color: '#d59ab6', desc: 'Good games. Better company. Your next favourite hangout.' }].filter(d => venueFilter === 'All' || d.type === venueFilter).map(d => <button key={d.name} className="district-card" onClick={() => { setDistrict(d.name); open('venue'); }} style={{ '--land': d.color } as React.CSSProperties}><div className="district-art"><span>{d.icon}</span><b>{d.type.toUpperCase()} / {d.state.toUpperCase()}</b></div><div><h2>{d.name}<ArrowUpRight size={22}/></h2><p>{d.desc}</p><small>FICTIONAL CREATOR EXPERIENCE</small></div></button>)}</div><div className="section-title"><h2>Your creator applications</h2></div>{s.applications.length ? s.applications.map((a, i) => <div className="activity-row" key={i}><Building2 size={20}/><strong>{a}</strong><span>Saved locally · demo review queue</span></div>) : <p className="muted">Your next neighbourhood could start here.</p>}</>}
        <footer className="page-footer"><Link className="brand" href="/">✳ uiinapur.</Link><span>A fictional nation. A shared imagination.</span><small>LOCAL DEMO · NO REAL MONEY OR LAND OWNERSHIP</small></footer></main>}
    <AnimatePresence>{plot && <motion.aside className={'inspector ' + (expandedSheet ? 'expanded-sheet' : '')} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} aria-label="Property inspector"><button className="sheet-grip" aria-label={expandedSheet ? 'Collapse property panel' : 'Expand property panel'} onClick={() => setExpandedSheet(!expandedSheet)}/><div className="panel-heading"><span>PROPERTY / {plot.id}</span><button className="icon-button" aria-label="Close property" onClick={() => { setSelected(null); if (page === 'explore')
        history.replaceState(null, '', '/'); }}><X size={18}/></button></div><div className="inspector-art" style={{ '--land': territory(plot.territory).color } as React.CSSProperties}><div className="terrain-tile"><div className="tiny-house"><i /><b /></div><span /><span /></div><span className="rarity">{plot.rarity} parcel</span></div><div className="inspector-body"><div className="eyebrow">{territory(plot.territory).name} / {plot.category} district</div><h2>{plot.id}<button aria-label="Favorite property" className={'icon-button ' + (s.favorites.includes(plot.id) ? 'liked' : '')} onClick={() => s.favorite(plot.id)}><Heart size={19} fill={s.favorites.includes(plot.id) ? 'currentColor' : 'none'}/></button></h2><p>A place for your next big idea.</p><div className="detail-grid"><div><small>PARCEL AREA</small><strong>{plot.area} m²</strong></div><div><small>OWNERSHIP</small><strong>{plot.owner === s.citizen?.id ? 'You' : plot.owner ? 'Fellow Uiiyan' : 'Nation treasury'}</strong></div><div><small>COORDINATES</small><strong>{plot.x.toFixed(2)}, {plot.z.toFixed(2)}</strong></div><div><small>STATUS</small><strong>{plot.listed ? 'Listed for resale' : plot.owner ? 'Citizen owned' : 'Available'}</strong></div></div><div className="price-label"><span>ILLUSTRATIVE ASKING PRICE</span><strong>{money(plot.price)}</strong></div><div className="price-chart"><div><span>Sample price history</span><small>6 MONTHS · ILLUSTRATIVE</small></div><svg viewBox="0 0 280 55" role="img" aria-label="Illustrative upward price series, not actual returns"><defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#64e8cf" stopOpacity=".25"/><stop offset="1" stopColor="#64e8cf" stopOpacity="0"/></linearGradient></defs><path d="M0 45 L40 38 L80 42 L125 23 L165 30 L210 13 L250 19 L280 5 V55 H0Z" fill="url(#chartfill)"/><path d="M0 45 L40 38 L80 42 L125 23 L165 30 L210 13 L250 19 L280 5" stroke="#64e8cf" strokeWidth="2" fill="none"/></svg></div><div className="inspector-actions">{plot.owner === s.citizen?.id ? <><button className="primary" onClick={() => { setDraft(plot.building || draft); open('build'); }}><Building2 size={16}/> Customize property</button><div className="button-row"><button className="soft-button" onClick={() => { setAmount(String(plot.price)); if (plot.listed) {
        s.withdraw(plot.id);
        notify('Listing withdrawn');
    }
    else
        open('list'); }}>{plot.listed ? 'Withdraw listing' : 'Create listing'}</button><button className="soft-button" onClick={() => open('deed')}>View deed</button></div></> : !plot.owner || plot.listed ? <><button className="primary" onClick={acquire}>Simulate acquisition <ArrowUpRight size={16}/></button>{plot.listed && <button className="soft-button" onClick={() => { setAmount(String(Math.round(plot.price * .9))); if (s.citizen)
        open('offer');
    else
        open('citizen'); }}>Make a demo offer</button>}</> : <button className="soft-button" onClick={() => { s.favorite(plot.id); notify('Watchlist updated'); }}><Heart size={15}/> {s.favorites.includes(plot.id) ? 'Remove from watchlist' : 'Add to watchlist'}</button>}<div className="button-row"><button className="text-link" onClick={() => share(plot.id)}><Copy size={14}/> Share parcel</button>{page !== 'explore' && <Link className="text-link" href={'/?plot=' + plot.id}><MapPin size={14}/> Explore location</Link>}</div></div><p className="demo-note"><Shield size={12}/> Demo simulation. No real payment or legal land ownership.</p><div className="timeline"><span className="eyebrow">PARCEL ACTIVITY</span><p>◇ Issued by the fictional nation</p>{s.transactions.filter(t => t.plot === plot.id).map(t => <p key={t.id}>◈ Ownership transferred · {new Date(t.date).toLocaleDateString('en-IN')}</p>)}{plot.listed && <p>↗ Currently listed on the Land Exchange</p>}</div></div></motion.aside>}</AnimatePresence>
    <Dialog.Root open={!!modal} onOpenChange={v => { if (!v)
        setModal(null); }}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content" aria-describedby={undefined}><Dialog.Close className="dialog-close" aria-label="Close dialog"><X size={20}/></Dialog.Close>
    <Dialog.Title>{({ citizen: 'A new world. A new you.', buy: 'Your next chapter starts here.', list: 'Put your property on the map.', offer: 'Start a conversation.', build: 'Make it unmistakably yours.', deed: 'Your piece of Uiinapur.', reset: 'Start a fresh story?', creator: 'Build a place people belong.', venue: district, share: 'Share this parcel' } as Record<string, string>)[modal || '']}</Dialog.Title>
    {modal === 'citizen' && <form onSubmit={e => { e.preventDefault(); if (!/^[\p{L}\p{N} _-]{2,24}$/u.test(name.trim())) {
        setError('Use 2–24 letters, numbers, spaces, underscores or hyphens.');
        return;
    } s.setCitizen({ name: name.trim(), state: s.citizen?.state || home, avatar, id: s.citizen?.id || 'UII-' + localId().slice(0, 8).toUpperCase(), joined: s.citizen?.joined || new Date().toISOString() }); s.seen(); setModal(null); notify('Welcome to Uiinapur. Your passport is ready.'); }}><p className="muted">A fictional identity for a world of possibilities.</p><label>Citizen display name<input required minLength={2} maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder={s.citizen?.name || 'What should we call you?'}/></label><label>Home state<select value={s.citizen?.state || home} disabled={!!s.citizen} onChange={e => setHome(e.target.value)}>{territories.slice(0, 5).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{s.citizen && <p className="muted">Home state stays fixed for this demo citizenship to preserve voting eligibility.</p>}<label>Your insignia</label><div className="avatar-picker">{avatarChoices.map(a => <button className={avatar === a ? 'selected' : ''} key={a} type="button" onClick={() => setAvatar(a)}>{a}</button>)}</div><button className="primary" type="submit">{s.citizen ? 'Save profile' : 'Create my citizenship'}<ArrowRight size={16}/></button></form>}
    {modal === 'buy' && plot && <><p className="muted">{plot.id} · {territory(plot.territory).name}</p><div className="purchase-total"><span>Illustrative acquisition</span><strong>{money(plot.price)}</strong><small>Includes 2.5% simulated treasury commission ({money(Math.round(plot.price * .025))}).</small></div><div className="disclosure compact"><Shield size={20}/><p>No money is charged. This creates fictional ownership in this browser only.</p></div><button className="primary" onClick={() => complete(() => s.buy(plot.id), 'Welcome home. Your deed is waiting in your vault.')}>Confirm demo acquisition <Check size={16}/></button></>}
    {(modal === 'list' || modal === 'offer') && plot && <form onSubmit={e => { e.preventDefault(); complete(() => modal === 'list' ? s.list(plot.id, Number(amount)) : s.offer(plot.id, Number(amount)), modal === 'list' ? 'Property listed on the Land Exchange' : 'Offer saved. Review it in your vault.'); }}><p className="muted">{plot.id} · Demo transaction only</p><label>{modal === 'list' ? 'Asking price (INR)' : 'Your offer (INR)'}<input autoFocus type="number" min="100" max="1000000" step="1" required value={amount} onChange={e => setAmount(e.target.value)}/></label><p className="muted">{modal === 'list' ? 'A 2.5% illustrative commission is included in the final sale price.' : 'Submitting an offer does not transfer ownership. Use the clearly labeled seller simulation in your vault.'}</p><button className="primary">{modal === 'list' ? 'Publish demo listing' : 'Submit demo offer'}<ArrowRight size={15}/></button></form>}
    {modal === 'build' && plot && <form onSubmit={e => { e.preventDefault(); s.build(plot.id, draft); setModal(null); notify('Your building is saved and updated on the map.'); }}>{!fallback ? <Suspense fallback={<p>Loading building preview…</p>}><BuildingPreview building={draft}/></Suspense> : <div className="building-preview" style={{ '--wall': draft.wall, '--roof': draft.roof, '--turn': draft.rotation + 'deg' } as React.CSSProperties}><div className={'model-house ' + (draft.template.includes('tower') || draft.template.includes('HQ') ? 'tall' : '')}><i /><span /><b /></div>{draft.garden && <span className="garden-tree">♣</span>}</div>}<label>Building template<select value={draft.template} onChange={e => setDraft({ ...draft, template: e.target.value })}>{templates.map(t => <option key={t}>{t}</option>)}</select></label><div className="button-row"><label>Walls<input type="color" value={draft.wall} onChange={e => setDraft({ ...draft, wall: e.target.value })}/></label><label>Roof<input type="color" value={draft.roof} onChange={e => setDraft({ ...draft, roof: e.target.value })}/></label></div><label>Rotation · {draft.rotation}°<input type="range" min="0" max="270" step="90" value={draft.rotation} onChange={e => setDraft({ ...draft, rotation: +e.target.value })}/></label><label className="checkbox-label"><input type="checkbox" checked={draft.garden} onChange={e => setDraft({ ...draft, garden: e.target.checked })}/> Add a little garden</label><button className="primary">Save to my property <Check size={16}/></button></form>}
    {modal === 'deed' && plot && <div className="deed"><span>✳</span><p className="eyebrow">REPUBLIC OF UIINAPUR</p><h2>Virtual land deed</h2><p>This fictional parcel belongs to</p><h3>{s.citizen?.name}</h3><strong>{plot.id}</strong><p>{territory(plot.territory).name} · {plot.area} m²</p><p>Recorded {new Date(s.transactions.find(t => t.plot === plot.id)?.date || s.citizen?.joined || '2026-10-25T00:00:00Z').toLocaleDateString('en-IN')}</p><small>FICTIONAL VIRTUAL PROPERTY · NOT A LEGAL TITLE</small><button className="soft-button" onClick={() => share(plot.id)}>Share property <Copy size={15}/></button></div>}
    {modal === 'reset' && <><p className="muted">This clears your local citizenship, properties, votes, offers and customizations, and restores the seeded nation.</p><button className="primary" onClick={() => { s.reset(); setSelected(null); setModal(null); notify('Demo restored to its original state.'); }}>Reset local demo</button></>}
    {modal === 'creator' && <form onSubmit={e => { e.preventDefault(); if (!s.citizen) {
        open('citizen');
        return;
    } s.apply(district.trim()); setModal(null); notify('Creator application saved locally.'); }}><p className="muted">Tell the nation what you want to create. Demo applications are saved in this browser.</p><label>District name<input required minLength={3} maxLength={60} value={district} onChange={e => setDistrict(e.target.value)} placeholder="Your corner of Uiinapur"/></label><label>Your idea<textarea required minLength={10} placeholder="What will people discover here?"/></label><button className="primary">Save creator application <ArrowRight size={15}/></button></form>}
    {modal === 'venue' && <><p className="muted">A fictional community destination. Discover a sample digital collectible from this creator.</p><div className="venue-collectible">✳<small>FOUNDING SEASON / EDITION 01</small></div><div className="activity-row"><strong>Founding edition artwork<small>Illustrative product · ₹199</small></strong><button className="soft-button" onClick={() => { s.addCart(district); notify('Added to your demo cart'); }}>{s.cart.includes(district) ? 'In cart' : 'Add to cart'}</button></div><div className="sample-metrics"><span>1.2k visits</span><span>240 interactions</span><small>ILLUSTRATIVE METRICS</small></div><button className="primary" disabled={!s.cart.length} onClick={() => { s.checkout(); notify('Demo checkout complete. No payment was taken.'); setModal(null); }}>Demo checkout ({s.cart.length} items)</button></>}
    {modal === 'share' && <input readOnly value={amount} aria-label="Property link" onFocus={e => e.target.select()}/>}
    {error && <p className="form-error" role="alert">{error}</p>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/"><Compass size={18}/>Explore</Link><Link href="/marketplace"><Layers size={18}/>Exchange</Link><Link href="/districts"><Building2 size={18}/>Districts</Link><Link href="/vault"><User size={18}/>My vault</Link></nav><AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><Check size={17}/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14}/></button></motion.div>}</AnimatePresence>
    </div>;
}
function Empty({ title, text }: {
    title: string;
    text: string;
}) { return <div className="empty-state"><Globe2 size={30}/><h3>{title}</h3><p>{text}</p><Link className="text-link" href="/marketplace">Explore the Land Exchange <ArrowRight size={16}/></Link></div>; }
```


## components/uiinapur/World.tsx

```tsx
'use client';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { MapControls, Html, Line } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import WalkController, { type WalkSession } from './WalkController';
import { dimensions } from './BuildingPreview';
type Controls = React.ElementRef<typeof MapControls>;
import { territories, plots, territory, hash, type Plot } from '@/lib/uiinapur/data';
import { useNation } from '@/lib/uiinapur/store';
export type WorldProps = {
    walk?: WalkSession;
    selected: string | null;
    region: string;
    onSelect: (id: string) => void;
    onRegion: (id: string) => void;
    view: number;
    status: string;
    onFail: () => void;
};
function Ground() { const shapes = useMemo(() => territories.map(t => { const s = new THREE.Shape(); t.points.forEach(([x, z], i) => i ? s.lineTo(x, -z) : s.moveTo(x, -z)); s.closePath(); return s; }), []); return <>{territories.map((t, i) => <group key={t.id}><mesh userData={{walkGround:true}} rotation={[-Math.PI / 2, 0, 0]} position={[0, .25, 0]} receiveShadow><extrudeGeometry args={[shapes[i], { depth: .7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .12, bevelThickness: .15 }]}/><meshStandardMaterial color={t.color} roughness={.9} metalness={.12}/></mesh><Line points={[...t.points, t.points[0]].map(([x, z]) => [x, 1.13, z])} color={t.color} lineWidth={1.4} transparent opacity={.85}/></group>)}</>; }
function Buildings({ items }: {
    items: Plot[];
}) { const walls = useRef<THREE.InstancedMesh>(null); const roofs = useRef<THREE.InstancedMesh>(null); const occupied = useMemo(() => items.filter(p => p.building), [items]); useEffect(() => { if (!walls.current || !roofs.current)
    return; const o = new THREE.Object3D(); occupied.forEach((p, i) => { const b = p.building!, [w, h, d] = dimensions(b.template); o.position.set(p.x, 1.12 + h / 2, p.z); o.rotation.set(0, b.rotation * Math.PI / 180, 0); o.scale.set(w, h, d); o.updateMatrix(); walls.current!.setMatrixAt(i, o.matrix); walls.current!.setColorAt(i, new THREE.Color(b.wall)); o.position.y = 1.12 + h + .08; o.scale.set(w + .04, .08, d + .04); o.updateMatrix(); roofs.current!.setMatrixAt(i, o.matrix); roofs.current!.setColorAt(i, new THREE.Color(b.roof)); }); walls.current.instanceMatrix.needsUpdate = true; roofs.current.instanceMatrix.needsUpdate = true; if (walls.current.instanceColor)
    walls.current.instanceColor.needsUpdate = true; if (roofs.current.instanceColor)
    roofs.current.instanceColor.needsUpdate = true; }, [occupied]); return <><instancedMesh userData={{walkSolid:true}} ref={walls} args={[undefined, undefined, occupied.length]} castShadow><boxGeometry /><meshStandardMaterial roughness={.6}/></instancedMesh><instancedMesh userData={{walkSolid:true}} ref={roofs} args={[undefined, undefined, occupied.length]} castShadow><boxGeometry /><meshStandardMaterial metalness={.4} roughness={.4}/></instancedMesh></>; }
function Parcels({ onSelect, selected, status, walk }: Pick<WorldProps, 'onSelect' | 'selected' | 'status' | 'walk'>) { const changes = useNation(s => s.changes), citizen = useNation(s => s.citizen); const items = useMemo(() => plots.map(p => ({ ...p, ...changes[p.id] })), [changes]); const visible = useMemo(() => items.filter(p => status === 'all' || (status === 'available' && !p.owner) || (status === 'owned' && p.owner === citizen?.id) || (status === 'listed' && p.listed)), [items, status, citizen]); const mesh = useRef<THREE.InstancedMesh>(null); const [hover, setHover] = useState<Plot | null>(null); useEffect(() => { if (!mesh.current)
    return; const o = new THREE.Object3D(); visible.forEach((p, i) => { o.position.set(p.x, 1.09, p.z); o.scale.set(.67, .035, .67); o.updateMatrix(); mesh.current!.setMatrixAt(i, o.matrix); const col = p.owner === citizen?.id ? '#84ffe0' : p.listed ? '#f2d79b' : p.owner ? '#647776' : territory(p.territory).color; mesh.current!.setColorAt(i, new THREE.Color(col).multiplyScalar(p.owner?.startsWith('citizen') ? .6 : .85)); }); mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor)
    mesh.current.instanceColor.needsUpdate = true; }, [visible, citizen]); const handle = (e: ThreeEvent<PointerEvent>) => { if(walk)return; e.stopPropagation(); const p = visible[e.instanceId ?? 0]; if (hover?.id !== p?.id)
    setHover(p); }; const selectedPlot = selected ? items.find(p => p.id === selected) : null; return <><instancedMesh ref={mesh} args={[undefined, undefined, visible.length]} onPointerMove={handle} onPointerOut={() => setHover(null)} onClick={e => { if(walk)return; e.stopPropagation(); if (e.delta < 5)
    onSelect(visible[e.instanceId ?? 0].id); }}><boxGeometry /><meshStandardMaterial roughness={.8}/></instancedMesh><Buildings items={items}/>{[walk ? null : hover, walk ? null : selectedPlot].map((p, i) => p && <group key={i} position={[p.x, 1.15, p.z]}><Line points={[[-.38, 0, -.38], [.38, 0, -.38], [.38, 0, .38], [-.38, 0, .38], [-.38, 0, -.38]]} color="#eafff6" lineWidth={2}/>{i === 0 && <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none' }}><div className="map-tooltip">{p.id}<small>{p.owner ? 'Citizen owned' : 'Available to discover'}</small></div></Html>}</group>)}</>; }
function Landscape() { return <>{Array.from({ length: 32 }, (_, i) => { const x = -5 + hash(i + 3) * 10, z = -11 - hash(i + 76) * 2, h = 1.2 + hash(i + 4) * 2.8; return <mesh userData={{walkGround:true}} key={'m' + i} position={[x, h / 2 + 1, z]} rotation={[0, hash(i) * 3, 0]} castShadow><coneGeometry args={[.8 + hash(i), h, 5]}/><meshStandardMaterial color={i % 3 === 0 ? '#b6c5b5' : '#4e7868'} roughness={1}/></mesh>; })}{Array.from({ length: 75 }, (_, i) => { const p = plots[i * 11 % plots.length]; return <mesh userData={{walkSolid:true}} key={'t' + i} position={[p.x + .3, 1.5, p.z + .3]} castShadow><coneGeometry args={[.18, .8, 5]}/><meshStandardMaterial color="#205b4e"/></mesh>; })}<group userData={{walkSolid:true}} position={[0, 1.1, 0]}><mesh position={[0, .25, 0]}><cylinderGeometry args={[1.1, 1.35, .5, 6]}/><meshStandardMaterial color="#b1c7be"/></mesh><mesh position={[0, 1.65, 0]}><cylinderGeometry args={[.27, .6, 2.5, 6]}/><meshStandardMaterial color="#dedccb" metalness={.5} roughness={.3}/></mesh><mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[.5]}/><meshStandardMaterial color="#8cf5da" emissive="#2aa58a" emissiveIntensity={.5}/></mesh></group><Line points={[[-6, 1.13, -9], [-5, 1.13, -7], [-3, 1.13, -5], [-1, 1.13, -4], [0, 1.13, -2], [2, 1.13, -1], [4, 1.13, 2], [6, 1.13, 4], [8, 1.13, 5]]} color="#264d5d" lineWidth={8}/></>; }
type SavedCamera = { position: THREE.Vector3; target: THREE.Vector3 };
/* eslint-disable react-hooks/immutability -- Camera snapshot is a shared mutable ref, written only in effects and their cleanup. */
function Camera({ region, selected, view, saved }: Pick<WorldProps, 'region' | 'selected' | 'view'> & {saved: React.RefObject<SavedCamera | null>}) { const { camera } = useThree(); const ref = useRef<Controls>(null); const first = useRef(true); useEffect(() => { const c = ref.current; if (!c)
    return; const p = plots.find(p => p.id === selected), t = territories.find(t => t.id === region); const target = p ? [p.x, 1, p.z] : t ? [t.center[0], 0, t.center[1]] : [0, 0, 0]; const distance = p ? 7 : t ? 19 : 43; const previous = first.current ? saved.current : null; first.current = false; saved.current = null; const destination = previous?.position || new THREE.Vector3(target[0] + distance * .55,distance * .9,target[2] + distance * .8); const destinationTarget = previous?.target || new THREE.Vector3(...target); const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; c.enabled = false; const timeline = gsap.timeline({ onComplete: () => { c.enabled = true; } }); timeline.to(camera.position, { x: destination.x, y: destination.y, z: destination.z, duration: reduced ? 0 : 1.6, ease: 'power3.inOut' }, 0).to(c.target, { x: destinationTarget.x, y: destinationTarget.y, z: destinationTarget.z, duration: reduced ? 0 : 1.6, ease: 'power3.inOut', onUpdate: () => c.update() }, 0); return () => { timeline.kill(); saved.current = {position:camera.position.clone(),target:c.target.clone()}; c.enabled = false; }; }, [camera, region, selected, view, saved]); return <MapControls ref={ref} makeDefault minDistance={4} maxDistance={85} maxPolarAngle={Math.PI / 2.6} minPolarAngle={.2} enableDamping dampingFactor={.08} onChange={() => { const c = ref.current; if (c) {
    c.target.x = THREE.MathUtils.clamp(c.target.x, -25, 25);
    c.target.z = THREE.MathUtils.clamp(c.target.z, -20, 20);
} }}/>; }
/* eslint-enable react-hooks/immutability */
class Boundary extends Component<{
    children: ReactNode;
    onFail: () => void;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onFail(); }
    render() { return this.state.failed ? null : this.props.children; }
}
function CanvasLifecycle({onFail}:{onFail:()=>void}) {const {gl}=useThree();useEffect(()=>{const canvas=gl.domElement;const lost=(event:Event)=>{event.preventDefault();onFail()};canvas.addEventListener('webglcontextlost',lost);return()=>canvas.removeEventListener('webglcontextlost',lost)},[gl,onFail]);return null;}
export default function World(props: WorldProps) { const environment=useRef<THREE.Group>(null); const saved=useRef<SavedCamera|null>(null); return <Boundary onFail={props.onFail}><Canvas shadows dpr={[1, 1.5]} camera={{ position: [24, 39, 35], fov: 44, near: .1, far: 250 }} gl={{ antialias: true, powerPreference: 'high-performance' }}><CanvasLifecycle onFail={props.onFail}/><color attach="background" args={['#0a171e']}/><fog attach="fog" args={['#0a171e', 65, 140]}/><ambientLight intensity={1.7}/><hemisphereLight args={['#ddffef', '#243d50', 1]}/><directionalLight position={[-20, 35, 15]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}/><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow><planeGeometry args={[250, 250]}/><meshStandardMaterial color="#102b35" roughness={.35} metalness={.6}/></mesh><gridHelper args={[180, 90, '#193d46', '#15343d']} position={[0, 0, 0]}/><group ref={environment}><Ground /><Landscape /><Parcels {...props}/></group>{!props.walk && territories.map(t => <Html key={t.id} position={[t.center[0], t.id === 'UMB' ? 4 : 2, t.center[1]]} center distanceFactor={50} zIndexRange={[10, 0]}><button className={'territory-label ' + (props.region === t.id ? 'chosen' : '')} onClick={() => props.onRegion(t.id)} style={{ '--territory': t.color } as React.CSSProperties}><i />{t.name}<span>{t.id === 'AUR' ? 'CAPITAL STATE' : t.id.startsWith('IS') ? 'OFFSHORE TERRITORY' : 'SOVEREIGN STATE'}</span></button></Html>)}<>{props.walk ? <WalkController {...props.walk} environment={environment} region={props.region} selected={props.selected}/> : <Camera {...props} saved={saved}/>}</></Canvas></Boundary>; }
```


## components/uiinapur/WalkExperience.tsx

```tsx
'use client';
/* eslint-disable react-hooks/immutability -- Imperative R3F simulation buffers are intentionally mutable; UI state is updated separately. */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ArrowUpRight, Footprints, LogOut, ArrowUp, Zap } from 'lucide-react';
import World, { type WorldProps } from './World';
import { freshWalkInput, type WalkStatus } from '@/lib/uiinapur/walk';

export default function WalkExperience(props: WorldProps) {
  const [active,setActive]=useState(false),[running,setRunning]=useState(false);
  const [status,setStatus]=useState<WalkStatus>({territory:'Uiinapur',motion:'Entering'});
  const input=useMemo(()=>freshWalkInput(),[]);
  const knob=useRef<HTMLSpanElement>(null),joystickPointer=useRef<number|null>(null);
  const exit=useCallback(()=>{Object.assign(input,freshWalkInput());setActive(false);setRunning(false);},[input]);
  const session=useMemo(()=>({input,onStatus:setStatus,onExit:exit}),[input,exit]);
  const resetJoystick=useCallback(()=>{input.x=input.y=0;joystickPointer.current=null;if(knob.current)knob.current.style.transform='translate(-50%, -50%)';},[input]);
  useEffect(()=>{
    const clear=()=>{resetJoystick();input.run=false;setRunning(false);};
    const visibility=()=>{if(document.hidden)clear();};
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);};
  },[input,resetJoystick]);
  function joystick(e:PointerEvent<HTMLDivElement>) {
    if(joystickPointer.current!==e.pointerId)return;
    const rect=e.currentTarget.getBoundingClientRect(),radius=rect.width*.32;
    let x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;
    const length=Math.hypot(x,y);if(length>radius){x*=radius/length;y*=radius/length;}
    input.x=x/radius;input.y=y/radius;
    if(knob.current)knob.current.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  }
  return <div className={'walk-experience '+(active?'walk-active':'')}>
    <World {...props} walk={active?session:undefined}/>
    {!active?<button className="walk-entry" onClick={()=>{setStatus({territory:'Uiinapur',motion:'Entering'});setActive(true);}}><Footprints size={18}/><span>Walk Into Uiinapur<small>SEE THE WORLD AT YOUR OWN PACE</small></span><ArrowUpRight size={18}/></button>:<>
      <section className="walk-hud" aria-label="Walk Mode controls">
        <div className="walk-identity"><Footprints size={20}/><div><small>ON FOOT / {status.motion.toUpperCase()}</small><strong>{status.territory}</strong></div></div>
        <button onClick={exit} className="walk-exit"><LogOut size={16}/>Exit Walk Mode</button>
      </section>
      {status.motion==='Unavailable'?<div className="walk-help" role="alert">No safe spawn found here. Exit and select another territory.</div>:<div className="walk-help"><span><kbd>W A S D</kbd> Walk</span><span><kbd>SHIFT</kbd> Run</span><span><kbd>SPACE</kbd> Jump</span><span>Drag to look · Scroll to zoom · Esc to exit</span></div>}
      <div className="walk-mobile">
        <div className="walk-joystick" role="group" aria-label="Movement joystick" onPointerDown={e=>{if(joystickPointer.current!==null)return;joystickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);joystick(e);}} onPointerMove={joystick} onPointerUp={resetJoystick} onPointerCancel={resetJoystick} onLostPointerCapture={resetJoystick}><span ref={knob}/><small>MOVE</small></div>
        <p>Drag the world to look<br/>Pinch to zoom</p>
        <div className="walk-mobile-actions"><button className={running?'is-running':''} aria-pressed={running} onClick={()=>{input.run=!running;setRunning(!running);}}><Zap size={21}/>{running?'Running':'Run'}</button><button onPointerDown={()=>{input.jump=true;}} onClick={e=>{if(e.detail===0)input.jump=true;}}><ArrowUp size={23}/>Jump</button></div>
      </div>
    </>}
  </div>;
}
```


## components/uiinapur/WalkController.tsx

```tsx
'use client';
/* eslint-disable react-hooks/immutability -- Imperative R3F simulation buffers are intentionally mutable; UI state is updated separately. */
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { inside, plots, territories } from '@/lib/uiinapur/data';
import { dryFootprint, movement, verticalStep, WALK, type WalkInput, type WalkStatus } from '@/lib/uiinapur/walk';
import WalkAvatar, { type AvatarMotion } from './WalkAvatar';

export type WalkSession = { input: WalkInput; onStatus: (status: WalkStatus) => void; onExit: () => void };
type Props = WalkSession & { environment: RefObject<THREE.Group | null>; region: string; selected: string | null };
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);

export default function WalkController({ environment, region, selected, input, onStatus, onExit }: Props) {
  const { camera, gl } = useThree();
  const avatar = useRef<THREE.Group>(null);
  const motion = useRef<AvatarMotion>({ speed: 0, grounded: true, phase: 0 });
  const state = useMemo(() => ({ position: new THREE.Vector3(), velocity: 0, grounded: true, initialized: false,
    failed: false, elapsed: 0, yaw: .6, pitch: .3, distance: 2.1, heading: 0, lastStatus: '', reset: 0,
    keys: new Set<string>(), ground: [] as THREE.Object3D[], solids: [] as THREE.Object3D[], all: [] as THREE.Object3D[],
    boxes: [] as THREE.Box3[], body: new THREE.Box3(), ray: new THREE.Raycaster(), origin: new THREE.Vector3(), direction: new THREE.Vector3(), target: new THREE.Vector3(),
    desired: new THREE.Vector3(), start: new THREE.Vector3(), startQ: new THREE.Quaternion(), goalQ: new THREE.Quaternion(),
    dummy: new THREE.Object3D(), normal: new THREE.Vector3(), spawn: new THREE.Vector3() }), []);

  useEffect(() => {
    const canvas = gl.domElement, pointers = new Map<number, { x: number; y: number }>();
    const previousTouch = canvas.style.touchAction, previousCursor = canvas.style.cursor;
    const originalNear = camera instanceof THREE.PerspectiveCamera ? camera.near : .1;
    if (camera instanceof THREE.PerspectiveCamera) { camera.near = .035; camera.updateProjectionMatrix(); }
    canvas.style.touchAction = 'none'; canvas.style.cursor = 'grab';
    const clear = () => { state.keys.clear(); input.x = input.y = 0; input.run = input.jump = false; input.reset++; pointers.clear(); };
    const editing = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]');
    const keydown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { clear(); onExit(); return; }
      if (editing(e.target)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(e.code)) {
        e.preventDefault(); state.keys.add(e.code); if (e.code === 'Space' && !e.repeat) input.jump = true;
      }
    };
    const keyup = (e: KeyboardEvent) => { state.keys.delete(e.code); };
    const down = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; pointers.set(e.pointerId, { x:e.clientX, y:e.clientY }); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId); if (!p) return;
      if (pointers.size === 2) {
        const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
        if (other) { const before = Math.hypot(p.x-other.x,p.y-other.y), after = Math.hypot(e.clientX-other.x,e.clientY-other.y); state.distance = THREE.MathUtils.clamp(state.distance + (before-after)*.007, .9, 4); }
      } else { state.yaw -= (e.clientX-p.x)*.005; state.pitch = THREE.MathUtils.clamp(state.pitch + (e.clientY-p.y)*.004, .12, 1.15); }
      pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    };
    const end = (e: PointerEvent) => { pointers.delete(e.pointerId); if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); canvas.style.cursor = 'grab'; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); state.distance = THREE.MathUtils.clamp(state.distance + e.deltaY*(e.deltaMode===1?.03:.002), .9, 4); };
    const visibility = () => { if (document.hidden) clear(); };
    window.addEventListener('keydown',keydown); window.addEventListener('keyup',keyup); window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',visibility);
    canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',move); canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end); canvas.addEventListener('lostpointercapture',end); canvas.addEventListener('wheel',wheel,{passive:false});
    return () => {
      clear(); window.removeEventListener('keydown',keydown); window.removeEventListener('keyup',keyup); window.removeEventListener('blur',clear); document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointerdown',down); canvas.removeEventListener('pointermove',move); canvas.removeEventListener('pointerup',end); canvas.removeEventListener('pointercancel',end); canvas.removeEventListener('lostpointercapture',end); canvas.removeEventListener('wheel',wheel);
      canvas.style.touchAction=previousTouch; canvas.style.cursor=previousCursor;
      if (camera instanceof THREE.PerspectiveCamera) { camera.near=originalNear; camera.updateProjectionMatrix(); }
    };
  }, [camera,gl,input,onExit,state]);

  function height(x:number,z:number) {
    state.origin.set(x, 30, z); state.ray.set(state.origin, DOWN); state.ray.far=40;
    const hit=state.ray.intersectObjects(state.ground,false)[0];
    if (!hit?.face) return null;
    state.normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    return {y:hit.point.y, slope:state.normal.y};
  }
  function footprint(x:number,z:number) {
    if (!dryFootprint(x,z)) return null;
    let highest=-Infinity, lowest=Infinity;
    for(let i=0;i<5;i++) {
      const a=i*Math.PI/2, r=i===4?0:WALK.radius;
      const sample=height(x+Math.cos(a)*r,z+Math.sin(a)*r);
      if(!sample || sample.slope<WALK.slope) return null;
      highest=Math.max(highest,sample.y); lowest=Math.min(lowest,sample.y);
    }
    return highest-lowest>WALK.step?null:highest;
  }
  function blocked(x:number,z:number,dx:number,dz:number,y:number) {
    const length=Math.hypot(dx,dz); if(length<1e-8)return false;
    state.direction.set(dx/length,0,dz/length);
    for(const level of [.07,.32,.61]) for(const side of [-1,0,1]) {
      state.origin.set(x-dz/length*WALK.radius*side,y+level,z+dx/length*WALK.radius*side);
      state.ray.set(state.origin,state.direction);state.ray.far=length+WALK.radius;
      if(state.ray.intersectObjects(state.solids,false).length) return true;
    }
    return false;
  }
  function safeSpawn(x:number,z:number) {
    const y=footprint(x,z); if(y===null)return null;
    state.body.min.set(x-WALK.radius,y+.01,z-WALK.radius);
    state.body.max.set(x+WALK.radius,y+WALK.height,z+WALK.radius);
    if(state.boxes.some(box=>box.intersectsBox(state.body)))return null;
    for(const [dx,dz] of [[.02,0],[-.02,0],[0,.02],[0,-.02]]) if(blocked(x,z,dx,dz,y))return null;
    return new THREE.Vector3(x,y,z);
  }
  function shortenCamera(position:THREE.Vector3) {
    state.direction.subVectors(position,state.target);
    const distance=state.direction.length();if(distance<.001)return;
    state.direction.divideScalar(distance);
    let allowed=distance;
    for(const offset of [-.07,0,.07]) {
      state.origin.copy(state.target);state.origin.x+=offset;
      state.ray.set(state.origin,state.direction);state.ray.far=distance+.1;
      const hit=state.ray.intersectObjects(state.all,false)[0];
      if(hit)allowed=Math.min(allowed,Math.max(.1,hit.distance-.14));
    }
    position.copy(state.target).addScaledVector(state.direction,allowed);
    const ground=height(position.x,position.z);
    if(ground)position.y=Math.max(position.y,ground.y+.12);
    position.y=Math.max(.2,position.y);
  }

  useFrame((_,delta) => {
    if(!avatar.current||!environment.current||state.failed)return;
    if(!state.initialized) {
      environment.current.updateWorldMatrix(true,true);
      environment.current.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        let p:THREE.Object3D|null=object,solid=false,ground=false;
        while(p&&p!==environment.current){solid ||= !!p.userData.walkSolid;ground ||= !!p.userData.walkGround;p=p.parent;}
        if(ground)state.ground.push(object);if(solid)state.solids.push(object);
      });
      state.all=[...state.ground,...state.solids];
      const matrix=new THREE.Matrix4(), instance=new THREE.Matrix4();
      for(const object of state.solids) {
        const mesh=object as THREE.Mesh;
        mesh.geometry.computeBoundingBox();
        const box=mesh.geometry.boundingBox;if(!box)continue;
        if(mesh instanceof THREE.InstancedMesh) {
          for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);state.boxes.push(box.clone().applyMatrix4(matrix));}
        } else state.boxes.push(box.clone().applyMatrix4(mesh.matrixWorld));
      }
      const selectedPlot=plots.find(p=>p.id===selected),territory=territories.find(t=>t.id===(selectedPlot?.territory||region))||territories[0];
      const center=selectedPlot?[selectedPlot.x,selectedPlot.z]:territory.center;
      let spawn:THREE.Vector3|null=null;
      for(let i=0;i<700&&!spawn;i++) {const r=.16*Math.sqrt(i),a=i*2.399963; const x=center[0]+Math.cos(a)*r,z=center[1]+Math.sin(a)*r;if(inside([x,z],territory.points))spawn=safeSpawn(x,z);}
      if(!spawn){state.failed=true;onStatus({territory:territory.name,motion:'Unavailable'});return;}
      state.position.copy(spawn);state.spawn.copy(spawn);state.start.copy(camera.position);state.startQ.copy(camera.quaternion);
      state.elapsed=matchMedia('(prefers-reduced-motion: reduce)').matches?1.2:0;state.initialized=true;
      avatar.current.visible=true;
    }
    const dt=Math.min(delta,.05);state.elapsed+=dt;
    const entering=state.elapsed<1.2;
    let x=(state.keys.has('KeyD')?1:0)-(state.keys.has('KeyA')?1:0)+input.x;
    let forward=(state.keys.has('KeyW')?1:0)-(state.keys.has('KeyS')?1:0)-input.y;
    if(entering){x=forward=0;input.jump=false;}
    const run=input.run||state.keys.has('ShiftLeft')||state.keys.has('ShiftRight');
    const dir=movement(x,forward,state.yaw),speed=run?WALK.runSpeed:WALK.speed;
    if(input.jump&&state.grounded&&!entering){state.velocity=WALK.jumpSpeed;state.grounded=false;}input.jump=false;
    const previousX=state.position.x,previousZ=state.position.z;
    const count=Math.max(1,Math.ceil(dt/(1/120))),step=dt/count;
    for(let i=0;i<count;i++) {
      for(const axis of ['x','z'] as const) {
        const deltaAxis=dir[axis]*speed*step;
        if(Math.abs(deltaAxis)<1e-8)continue;
        const nx=state.position.x+(axis==='x'?deltaAxis:0),nz=state.position.z+(axis==='z'?deltaAxis:0);
        const floor=footprint(nx,nz);
        if(floor!==null&&floor-state.position.y<=WALK.step&&!blocked(state.position.x,state.position.z,nx-state.position.x,nz-state.position.z,state.position.y)) {
          state.position.x=nx;state.position.z=nz;
        }
      }
      const floor=footprint(state.position.x,state.position.z);
      if(floor===null){state.position.copy(state.spawn);state.velocity=0;state.grounded=true;continue;}
      if(state.velocity>0){state.origin.copy(state.position);state.origin.y+=WALK.height;state.ray.set(state.origin,UP);state.ray.far=state.velocity*step+.04;if(state.ray.intersectObjects(state.solids,false).length)state.velocity=0;}
      const next=verticalStep(state.position.y,state.velocity,floor,step);
      state.position.y=next.y;state.velocity=next.velocity;state.grounded=next.grounded;
    }
    const actual=Math.hypot(state.position.x-previousX,state.position.z-previousZ)/Math.max(dt,.001);
    if(Math.hypot(x,forward)>.05){const angle=Math.atan2(dir.x,dir.z);state.heading+=Math.atan2(Math.sin(angle-state.heading),Math.cos(angle-state.heading))*(1-Math.exp(-14*dt));}
    avatar.current.position.copy(state.position);avatar.current.rotation.y=state.heading;
    motion.current.speed=actual;motion.current.grounded=state.grounded;
    state.target.copy(state.position);state.target.y+=.48;
    state.desired.set(Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),Math.cos(state.yaw)*Math.cos(state.pitch)).multiplyScalar(state.distance).add(state.target);
    shortenCamera(state.desired);
    if(entering) {
      const t=state.elapsed/1.2,ease=t*t*(3-2*t);
      camera.position.lerpVectors(state.start,state.desired,ease);
      shortenCamera(camera.position);
      state.dummy.position.copy(camera.position);state.dummy.lookAt(state.target);state.goalQ.copy(state.dummy.quaternion);
      camera.quaternion.slerpQuaternions(state.startQ,state.goalQ,ease);
    } else {
      camera.position.lerp(state.desired,1-Math.exp(-10*dt));shortenCamera(camera.position);camera.lookAt(state.target);
    }
    const name=territories.find(t=>inside([state.position.x,state.position.z],t.points))?.name||'Uiinapur';
    const mode:WalkStatus['motion']=entering?'Entering':!state.grounded?'Jumping':actual>.05?(run?'Running':'Walking'):'Idle';
    const key=name+mode;if(key!==state.lastStatus){state.lastStatus=key;onStatus({territory:name,motion:mode});}
  });
  return <group ref={avatar} visible={false}><WalkAvatar motion={motion}/></group>;
}
```


## components/uiinapur/WalkAvatar.tsx

```tsx
'use client';
/* eslint-disable react-hooks/immutability -- Imperative R3F simulation buffers are intentionally mutable; UI state is updated separately. */
import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AvatarMotion = { speed: number; grounded: boolean; phase: number };
export default function WalkAvatar({ motion }: { motion: RefObject<AvatarMotion> }) {
  const body = useRef<THREE.Group>(null), leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const m = motion.current;
    m.phase += Math.min(dt, .05) * (m.speed > 1.5 ? 15 : m.speed > .1 ? 10 : 2);
    const amplitude = m.speed > .1 ? Math.min(.75, m.speed * .4) : .025;
    const swing = Math.sin(m.phase) * amplitude;
    if (leftArm.current) leftArm.current.rotation.x = m.grounded ? -swing : -.8;
    if (rightArm.current) rightArm.current.rotation.x = m.grounded ? swing : -.8;
    if (leftLeg.current) leftLeg.current.rotation.x = m.grounded ? swing : .4;
    if (rightLeg.current) rightLeg.current.rotation.x = m.grounded ? -swing : -.35;
    if (body.current) body.current.position.y = m.grounded ? Math.abs(Math.sin(m.phase)) * (m.speed > .1 ? .012 : .003) : 0;
  });
  return <group ref={body}>
    <mesh position={[0, .42, 0]} castShadow><capsuleGeometry args={[.09, .15, 4, 10]}/><meshStandardMaterial color="#39796c" roughness={.65}/></mesh>
    <mesh position={[0, .455, .086]}><boxGeometry args={[.038, .038, .012]}/><meshStandardMaterial color="#f0c987" metalness={.5} roughness={.3}/></mesh>
    <mesh position={[0, .605, 0]} castShadow><sphereGeometry args={[.082, 16, 12]}/><meshStandardMaterial color="#d7ae91"/></mesh>
    <mesh position={[0, .65, -.008]} castShadow><sphereGeometry args={[.084, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color="#17252c"/></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .028, .614, .074]}><sphereGeometry args={[.009, 8, 6]}/><meshStandardMaterial color="#14242b"/></mesh>)}
    <mesh position={[0, .42, -.095]} castShadow><boxGeometry args={[.11, .14, .055]}/><meshStandardMaterial color="#203944"/></mesh>
    {[-1, 1].map(side => <group ref={side < 0 ? leftArm : rightArm} key={'arm' + side} position={[side * .13, .48, 0]}>
      <mesh position={[0, -.075, 0]} castShadow><capsuleGeometry args={[.031, .12, 4, 8]}/><meshStandardMaterial color="#39796c"/></mesh>
      <group position={[0, -.15, 0]} rotation={[-.18, 0, side * .05]}><mesh position={[0, -.035, 0]} castShadow><capsuleGeometry args={[.026, .06, 4, 8]}/><meshStandardMaterial color="#d7ae91"/></mesh></group>
    </group>)}
    {[-1, 1].map(side => <group ref={side < 0 ? leftLeg : rightLeg} key={'leg' + side} position={[side * .049, .29, 0]}>
      <mesh position={[0, -.095, 0]} castShadow><capsuleGeometry args={[.036, .14, 4, 8]}/><meshStandardMaterial color="#20323e"/></mesh>
      <mesh position={[0, -.24, .018]} castShadow><boxGeometry args={[.075, .055, .115]}/><meshStandardMaterial color="#c2d3c4" roughness={.8}/></mesh>
    </group>)}
  </group>;
}
```


## components/uiinapur/walk.css

```css
.walk-experience { position:absolute; inset:0; }
.walk-entry { position:absolute; top:86px; right:32px; z-index:15; display:flex; align-items:center; gap:14px; padding:15px 19px; border:1px solid #a4ecd04a; border-radius:10px; background:#112b2be8; color:#bcefd8; box-shadow:0 10px 35px #0003; backdrop-filter:blur(16px); }
.walk-entry span { text-align:left; font-size:13px; }
.walk-entry small { display:block; font-size:6px; letter-spacing:1.4px; margin-top:6px; color:#88aca2; }
.walk-entry:hover { background:#1d3c35; border-color:#a4ecd0; }
.walk-hud { position:absolute; top:25px; left:25px; right:25px; z-index:20; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; }
.walk-identity { display:flex; align-items:center; gap:13px; padding:15px 20px; border:1px solid #a4ecd029; border-radius:10px; background:#0c1e27dc; backdrop-filter:blur(16px); color:#a4ecd0; }
.walk-identity small { display:block; color:#e8c78e; font-size:8px; letter-spacing:1.4px; margin-bottom:6px; }
.walk-identity strong { font-size:19px; font-weight:400; color:#eff5eb; }
.walk-exit { pointer-events:auto; display:flex; align-items:center; gap:9px; min-height:44px; padding:12px 17px; border:1px solid #a4ecd044; background:#10262ae8; border-radius:7px; font-size:11px; color:#a4ecd0; }
.walk-help { position:absolute; bottom:28px; left:50%; transform:translateX(-50%); z-index:20; display:flex; align-items:center; gap:23px; width:max-content; max-width:94%; padding:15px 22px; border:1px solid #ffffff1a; border-radius:9px; background:#0b2028dc; color:#a6bfba; font-size:10px; backdrop-filter:blur(12px); pointer-events:none; }
.walk-help span { display:flex; gap:8px; align-items:center; }
.walk-help kbd { border:1px solid #a4ecd030; border-radius:4px; padding:5px 7px; color:#d6e6db; font-size:9px; }
.walk-mobile { display:none; }
/* Preserve the aerial UI/state, but remove its pointer and keyboard targets while walking. */
.explorer:has(.walk-active) > :is(.world-intro,.explorer-tools,.plot-browser,.world-coordinate,.map-controls,.world-footer,.welcome-note,.world-vignette),
.application:has(.walk-active) > :is(.inspector,.mobile-bottom-nav) { display:none; }
@media (max-width:800px), (pointer:coarse) {
  .walk-entry { top:22px; right:18px; padding:12px; gap:8px; }
  .walk-entry span { font-size:10px; }
  .walk-entry small { display:none; }
  .walk-hud { top:18px; left:16px; right:16px; }
  .walk-identity { padding:12px; gap:8px; }
  .walk-identity strong { font-size:16px; }
  .walk-identity small { font-size:6px; }
  .walk-exit { font-size:10px; padding:11px; }
  .walk-help { display:none; }
  .walk-mobile { position:absolute; inset:auto 0 calc(24px + env(safe-area-inset-bottom)); display:flex; justify-content:space-between; align-items:flex-end; padding:0 24px; z-index:25; pointer-events:none; }
  .walk-joystick { position:relative; width:116px; height:116px; flex-shrink:0; border:1px solid #a4ecd04d; border-radius:50%; background:#102b2b99; pointer-events:auto; touch-action:none; user-select:none; }
  .walk-joystick > span { position:absolute; left:50%; top:50%; width:43px; height:43px; transform:translate(-50%,-50%); border-radius:50%; border:1px solid #d1f5da77; background:#a4ecd045; box-shadow:0 4px 18px #0005; pointer-events:none; }
  .walk-joystick small { position:absolute; bottom:-17px; left:0; width:100%; text-align:center; color:#a4b9ae; font-size:7px; letter-spacing:2px; }
  .walk-mobile p { font-size:8px; color:#aac5bc; text-align:center; align-self:center; margin:0 8px; text-shadow:0 1px 5px #000; }
  .walk-mobile-actions { pointer-events:auto; display:flex; flex-direction:column; gap:12px; }
  .walk-mobile-actions button { display:flex; flex-direction:column; align-items:center; justify-content:center; width:58px; height:58px; gap:3px; background:#112b2bdd; border:1px solid #a4ecd044; border-radius:50%; color:#a4ecd0; font-size:9px; touch-action:none; }
  .walk-mobile-actions .is-running { color:#142d25; background:#a4ecd0; }
  .explorer:has(.walk-active) { min-height:0; height:calc(100dvh - 70px); }
}
@media (max-width:480px) { .walk-entry { top:202px; left:24px; right:auto; } }

.walk-help[role="alert"] { display:block; bottom:180px; white-space:normal; text-align:center; }
.walk-entry:disabled { opacity:.65; cursor:not-allowed; }
```


## lib/uiinapur/walk.ts

```ts
import { inside, river, territories } from './data';

export const WALK = { radius: 0.11, height: 0.68, speed: 1.2, runSpeed: 2.25, gravity: 7.5, jumpSpeed: 2.3, step: 0.14, slope: 0.65 } as const;
export type WalkInput = { x: number; y: number; run: boolean; jump: boolean; reset: number };
export type WalkStatus = { territory: string; motion: 'Entering' | 'Idle' | 'Walking' | 'Running' | 'Jumping' | 'Unavailable' };
export const freshWalkInput = (): WalkInput => ({ x: 0, y: 0, run: false, jump: false, reset: 0 });

export function riverDistance(x: number, z: number) {
  let nearest = Infinity;
  for (let i = 1; i < river.length; i++) {
    const a = river[i - 1], b = river[i], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    nearest = Math.min(nearest, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz));
  }
  return nearest;
}

// Test a footprint against the UNION: internal state borders remain traversable.
export function dryFootprint(x: number, z: number, radius: number = WALK.radius) {
  if (riverDistance(x, z) < 0.24 + radius) return false;
  for (let i = 0; i < 9; i++) {
    const angle = i * Math.PI / 4, r = i === 8 ? 0 : radius;
    const p: [number, number] = [x + Math.cos(angle) * r, z + Math.sin(angle) * r];
    if (!territories.some(t => inside(p, t.points))) return false;
  }
  return true;
}

export function movement(x: number, forward: number, yaw: number) {
  const length = Math.max(1, Math.hypot(x, forward));
  return { x: (x * Math.cos(yaw) - forward * Math.sin(yaw)) / length,
    z: (-x * Math.sin(yaw) - forward * Math.cos(yaw)) / length };
}

export function verticalStep(y: number, velocity: number, ground: number, dt: number) {
  const v = velocity - WALK.gravity * dt, next = y + v * dt;
  return next <= ground ? { y: ground, velocity: 0, grounded: true } : { y: next, velocity: v, grounded: false };
}
```


## scripts/test-walk.mjs

```javascript
import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
mkdirSync('work/walk-test',{recursive:true});
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/uiinapur/walk.ts','--outDir','work/walk-test','--module','commonjs','--target','es2020','--esModuleInterop','--skipLibCheck'],{stdio:'inherit'});
if(compile.status!==0)process.exit(compile.status||1);
writeFileSync('work/walk-test/package.json','{"type":"commonjs"}');
const test=spawnSync(process.execPath,['tests/walk.cjs'],{stdio:'inherit'});
process.exit(test.status||0);
```


## tests/walk.cjs

```javascript
const assert=require('node:assert/strict');
const {dryFootprint,movement,verticalStep,WALK,riverDistance}=require('../work/walk-test/walk.js');
const {territories,inside}=require('../work/walk-test/data.js');
for(const yaw of [0,.3,Math.PI/2,Math.PI]) {
 const d=movement(1,1,yaw);assert(Math.abs(Math.hypot(d.x,d.z)-1)<1e-10,'no diagonal speed boost');
}
assert.deepEqual(movement(0,1,0),{x:0,z:-1});
assert(Math.abs(movement(0,1,Math.PI/2).x+1)<1e-10);
assert(!dryFootprint(80,80));assert(!dryFootprint(0,-2));assert(riverDistance(0,-2)<1e-8);
for(const t of territories){let safe=0;for(let x=-24;x<25;x+=.2)for(let z=-16;z<18;z+=.2)if(inside([x,z],t.points)&&dryFootprint(x,z))safe++;assert(safe>10,t.name+' has safe spawn candidates');}
// Shared state boundaries are not artificial walls.
assert(dryFootprint(-4.5,3),'Internal AUR/INA border remains passable');
for(const fps of [20,30,60,120]) {
 let p={y:1.1,velocity:WALK.jumpSpeed,grounded:false},peak=p.y;
 for(let i=0;i<fps*2;i++){p=verticalStep(p.y,p.velocity,1.1,1/fps);peak=Math.max(peak,p.y);}
 assert.equal(p.y,1.1);assert.equal(p.velocity,0);assert(p.grounded);assert(peak>1.35&&peak<1.5);
}
console.log('PASS: normalized camera-relative movement, 7 territory footprints, coastline/river blocking, shared borders, gravity, jump and landing at 20/30/60/120 Hz.');
```
