export type Point = [
    number,
    number
];
export type Territory = {
    id: string;
    name: string;
    color: string;
    subtitle: string;
    center: Point;
    points: Point[];
};
export const territories: Territory[] = [
    { id: 'AUR', name: 'Aurayarr', color: '#ad9be7', subtitle: 'The heart of a new world', center: [0, 0], points: [[-5, -4], [0, -6], [5, -4], [6, 1], [3, 5], [-3, 5], [-6, 1]] },
    { id: 'UMB', name: 'Umbuiina', color: '#79bd93', subtitle: 'Where the wild finds a home', center: [0, -10], points: [[-5, -4], [-8, -8], [-6, -12], [-3, -14], [0, -15], [3, -13], [6, -14], [8, -9], [5, -4], [0, -6]] },
    { id: 'INA', name: 'Inaris', color: '#e2c37e', subtitle: 'Golden shores. Infinite possibilities.', center: [-10, 0], points: [[-5, -4], [-6, 1], [-3, 5], [-7, 8], [-11, 6], [-14, 7], [-16, 3], [-14, 0], [-15, -3], [-11, -6], [-8, -8]] },
    { id: 'PNK', name: 'Pinkyork', color: '#d797b5', subtitle: 'A city for the beautifully different', center: [10, 0], points: [[5, -4], [8, -9], [11, -7], [14, -5], [13, -2], [16, 0], [15, 4], [12, 7], [8, 6], [3, 5], [6, 1]] },
    { id: 'FUI', name: 'Fuina', color: '#79aeda', subtitle: 'Made of ocean and ambition', center: [0, 9], points: [[-3, 5], [3, 5], [8, 6], [9, 10], [6, 12], [5, 15], [1, 16], [-2, 14], [-6, 13], [-9, 10], [-7, 8]] },
    { id: 'IS1', name: 'Poo', color: '#73c9bd', subtitle: 'A quiet corner of the extraordinary', center: [-19, 11], points: [[-22, 9], [-19, 7], [-16, 9], [-16, 12], [-19, 14], [-22, 12]] },
    { id: 'IS2', name: 'Smile', color: '#c7b18a', subtitle: 'Beyond the familiar horizon', center: [20, -10], points: [[18, -13], [21, -14], [24, -11], [23, -8], [20, -6], [17, -9]] }
];
export function inside(p: Point, poly: Point[]) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (((a[1] > p[1]) !== (b[1] > p[1])) && (p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]))
        c = !c;
} return c; }
export function hash(n: number) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export type Building = {
    template: string;
    wall: string;
    roof: string;
    rotation: number;
    garden: boolean;
};
export type Plot = {
    id: string;
    territory: string;
    x: number;
    z: number;
    area: number;
    category: string;
    rarity: string;
    price: number;
    owner: string | null;
    listed: boolean;
    building: Building | null;
    issued: number;
};
export const templates = ['Starter house', 'Modern villa', 'Luxury tower', 'Commercial shop', 'Creative studio', 'Futuristic HQ'];
export const river: Point[] = [[-6, -9], [-5, -7], [-3, -5], [-1, -4], [0, -2], [2, -1], [4, 2], [6, 4], [8, 5]];
export function protectedLand(x: number, z: number) { if (Math.hypot(x, z) < 1.8)
    return true; return river.slice(1).some((b, i) => { const a = river[i], dx = b[0] - a[0], dz = b[1] - a[1], u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - u * dx, z - a[1] - u * dz) < .7; }); }
export const plots: Plot[] = [];
territories.forEach((t) => { let n = 0; for (let x = -23; x < 25; x += .85)
    for (let z = -15; z < 17; z += .85) {
        const half = .34;
        if (![[-half, -half], [half, half], [-half, half], [half, -half]].every(([dx, dz]) => inside([x + dx, z + dz], t.points)))
            continue;
        if (Math.abs(x) % 5 < .7 || Math.abs(z) % 5 < .65)
            continue;
        if (t.id === 'UMB' && z < -10)
            continue;
        if (protectedLand(x, z))
            continue;
        const k = plots.length + 1, r = hash(k), price = Math.round((1500 + r * 13500) / 50) * 50;
        n++;
        plots.push({ id: `${t.id}-${String(n).padStart(4, '0')}`, territory: t.id, x, z, area: 100 + Math.floor(r * 8) * 25, category: r > .7 ? 'Commercial' : r > .4 ? 'Residential' : 'Creative', rarity: r > .88 ? 'Legendary' : r > .65 ? 'Rare' : 'Common', price, issued: price, owner: r > .70 ? 'citizen-' + (k % 6) : null, listed: r > .84, building: r > .7 ? { template: templates[k % 6], wall: t.color, roof: '#314c51', rotation: 0, garden: r > .9 } : null });
    } });
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const territory = (id: string) => territories.find(t => t.id === id)!;
