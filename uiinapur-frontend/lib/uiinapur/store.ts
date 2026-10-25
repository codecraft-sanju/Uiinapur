'use client';
import { localId } from './id';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { plots, type Plot, type Building } from './data';
export type Citizen = {
    name: string;
    state: string;
    avatar: string;
    id: string;
    joined: string;
};
export type Offer = {
    id: string;
    plot: string;
    buyer: string;
    seller: string;
    amount: number;
    status: 'pending' | 'accepted' | 'rejected';
};
export type Transaction = {
    id: string;
    plot: string;
    buyer: string;
    seller: string;
    amount: number;
    fee: number;
    date: string;
};
type State = {
    citizen: Citizen | null;
    changes: Record<string, Partial<Plot>>;
    favorites: string[];
    transactions: Transaction[];
    offers: Offer[];
    votes: Record<string, string>;
    membership: string;
    introSeen: boolean;
    cart: string[];
    applications: string[];
    setCitizen: (c: Citizen) => void;
    seen: () => void;
    favorite: (id: string) => void;
    buy: (id: string) => string | null;
    list: (id: string, price: number) => string | null;
    withdraw: (id: string) => void;
    build: (id: string, b: Building) => void;
    offer: (id: string, amount: number) => string | null;
    resolveOffer: (id: string, accept: boolean) => string | null;
    vote: (e: string, c: string) => boolean;
    plan: (p: string) => void;
    addCart: (id: string) => void;
    checkout: () => void;
    apply: (s: string) => void;
    reset: () => void;
};
const base = { citizen: null, changes: {}, favorites: [], transactions: [], offers: [], votes: {}, membership: 'Free Citizen', introSeen: false, cart: [], applications: [] };
export const getPlot = (id: string, s: {
    changes: Record<string, Partial<Plot>>;
}): Plot => ({ ...plots.find(p => p.id === id)!, ...s.changes[id] });
const transaction = (p: Plot, buyer: string, amount: number): Transaction => ({ id: localId(), plot: p.id, buyer, seller: p.owner || 'Nation treasury', amount, fee: Math.round(amount * .025), date: new Date().toISOString() });
export const useNation = create<State>()(persist((set, get) => ({ ...base,
    setCitizen: citizen => set({ citizen }), seen: () => set({ introSeen: true }), favorite: id => set(s => ({ favorites: s.favorites.includes(id) ? s.favorites.filter(x => x !== id) : [...s.favorites, id] })),
    buy: id => { const s = get(), p = getPlot(id, s); if (!s.citizen)
        return 'Create your citizenship first.'; if (!p.id)
        return 'Plot not found.'; if (p.owner === s.citizen.id)
        return 'You already own this property.'; if (p.owner && !p.listed)
        return 'This property is not for sale.'; set({ changes: { ...s.changes, [id]: { ...s.changes[id], owner: s.citizen.id, listed: false } }, transactions: [transaction(p, s.citizen.id, p.price), ...s.transactions], offers: s.offers.map(o => o.plot === id && o.status === 'pending' ? { ...o, status: 'rejected' } : o) }); return null; },
    list: (id, price) => { const s = get(), p = getPlot(id, s); if (!s.citizen || p.owner !== s.citizen.id)
        return 'Only the owner can list this plot.'; if (!Number.isFinite(price) || price < 100 || price > 1000000)
        return 'Enter a price between ₹100 and ₹10,00,000.'; set({ changes: { ...s.changes, [id]: { ...s.changes[id], listed: true, price: Math.round(price) } } }); return null; },
    withdraw: id => set(s => getPlot(id, s).owner === s.citizen?.id ? { changes: { ...s.changes, [id]: { ...s.changes[id], listed: false } } } : {}),
    build: (id, b) => set(s => getPlot(id, s).owner === s.citizen?.id ? { changes: { ...s.changes, [id]: { ...s.changes[id], building: b } } } : {}),
    offer: (id, amount) => { const s = get(), p = getPlot(id, s); if (!s.citizen)
        return 'Create your citizenship first.'; if (!p.listed || !p.owner || p.owner === s.citizen.id)
        return 'Offers require another citizen’s active listing.'; if (!Number.isFinite(amount) || amount < 100 || amount > 1000000)
        return 'Enter a valid offer from ₹100 to ₹10,00,000.'; if (s.offers.some(o => o.plot === id && o.buyer === s.citizen?.id && o.status === 'pending'))
        return 'You already have a pending offer.'; set({ offers: [{ id: localId(), plot: id, buyer: s.citizen.id, seller: p.owner, amount: Math.round(amount), status: 'pending' }, ...s.offers] }); return null; },
    resolveOffer: (id, accept) => { const s = get(), o = s.offers.find(o => o.id === id); if (!o || o.status !== 'pending')
        return 'Offer is no longer pending.'; const p = getPlot(o.plot, s); if (p.owner !== o.seller || !p.listed)
        return 'The listing has changed.'; set({ offers: s.offers.map(v => v.id === id ? { ...v, status: accept ? 'accepted' : 'rejected' } : accept && v.plot === o.plot && v.status === 'pending' ? { ...v, status: 'rejected' } : v), ...(accept ? { changes: { ...s.changes, [p.id]: { ...s.changes[p.id], owner: o.buyer, listed: false } }, transactions: [transaction(p, o.buyer, o.amount), ...s.transactions] } : {}) }); return null; },
    vote: (e, c) => { const s = get(); if (!s.citizen || s.votes[e] || s.citizen.state !== e)
        return false; set({ votes: { ...s.votes, [e]: c } }); return true; }, plan: membership => set({ membership }), addCart: id => set(s => ({ cart: s.cart.includes(id) ? s.cart : [...s.cart, id] })), checkout: () => set({ cart: [] }), apply: s => set(v => ({ applications: [...v.applications, s] })), reset: () => set({ ...base }) }), { name: 'uiinapur-nation-v1', version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true }));
