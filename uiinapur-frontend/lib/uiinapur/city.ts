import { plots, type Point } from './data';
import { dryFootprint } from './walk';

export type Rect = { x: number; z: number; w: number; d: number };
export type Architecture = Rect & { id: string; name: string; kind: 'residence'|'villa'|'cafe'|'market'|'welcome'|'studio'; h: number; rotation: number; door: Point };
export const PLAZA = { x: -5, z: 0, w: 2.3, d: 1.3, name: 'Uiinapur Central Plaza' };
export const PLAZA_SPAWN: Point = [-5, .55];
// These are public corridor sites, never replacements for parcels.
export const CITY_BUILDINGS: Architecture[] = [
  { id:'residence',name:'Emerald Residences',kind:'residence',x:-9.6,z:-.5,w:.6,d:.6,h:1.15,rotation:0,door:[-9.6,0] },
  { id:'villa',name:'Champagne Villa',kind:'villa',x:-8.6,z:-.5,w:.6,d:.6,h:.76,rotation:0,door:[-8.6,0] },
  { id:'welcome',name:'National Welcome Center',kind:'welcome',x:-3.5,z:-.5,w:.6,d:.6,h:1.08,rotation:0,door:[-3.5,0] },
  { id:'cafe',name:'Café Aurayarr',kind:'cafe',x:-2.5,z:-.5,w:.6,d:.6,h:.78,rotation:0,door:[-2.5,0] },
  { id:'market',name:'The Little Exchange',kind:'market',x:-7.6,z:-.5,w:.6,d:.6,h:.82,rotation:0,door:[-7.6,0] },
  { id:'studio',name:'Atelier Uiinapur',kind:'studio',x:-6.6,z:-.5,w:.6,d:.6,h:1.12,rotation:0,door:[-6.6,0] },
];
export const GARDENS: Rect[] = [{x:-5.85,z:-.5,w:.23,d:.23},{x:-4.15,z:-.5,w:.23,d:.23}];
export const BENCHES: Rect[] = [{x:-5.85,z:.1,w:.35,d:.17},{x:-4.15,z:.1,w:.35,d:.17}];
export const LAMPS: Point[] = [[-6.08,-.6],[-3.92,-.6],[-7.8,.5],[-2,.5],[-4.85,-1.6],[-4.85,-4.2]];
export const parcelReservations: Rect[] = plots.map(p=>({x:p.x,z:p.z,w:.86,d:.86}));
// Include the unchanged decorative trees, including crowns extending beyond plot edges.
export const legacyTrees: Rect[] = Array.from({length:75},(_,i)=>{const p=plots[i*11%plots.length];return{x:p.x+.3,z:p.z+.3,w:.4,d:.4};});
export const buildingEnvelope = (b:Architecture):Rect => ({x:b.x,z:b.z,w:(b.rotation?b.d:b.w)+.08,d:(b.rotation?b.w:b.d)+.08});
export const overlaps = (a:Rect,b:Rect,gap=0) => Math.abs(a.x-b.x)<(a.w+b.w)/2+gap && Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
export const cityObstacles:Rect[] = [...CITY_BUILDINGS.map(buildingEnvelope),...GARDENS,...BENCHES,...LAMPS.map(([x,z])=>({x,z,w:.12,d:.12})),{x:-5,z:0,w:.58,d:.58}];
export function publicLand(x:number,z:number,radius:number) {
  const area={x,z,w:radius*2,d:radius*2};
  return dryFootprint(x,z,radius) && !parcelReservations.some(p=>overlaps(area,p)) && !legacyTrees.some(p=>overlaps(area,p)) && Math.hypot(x,z)>1.4+radius;
}
export function clearStreet(x:number,z:number,radius=.13) {
  return publicLand(x,z,radius)&&!cityObstacles.some(p=>overlaps({x,z,w:radius*2,d:radius*2},p,.015));
}

const STEP=.1, MIN_X=-10.5,MIN_Z=-4.5,COLS=111,ROWS=61;
const point=(id:number):Point=>[MIN_X+(id%COLS)*STEP,MIN_Z+Math.floor(id/COLS)*STEP];
const index=([x,z]:Point)=>Math.round((z-MIN_Z)/STEP)*COLS+Math.round((x-MIN_X)/STEP);
export type CityPlan = { roads:Point[]; routes:Point[][]; destinations:Point[] };
export function createCityPlan():CityPlan {
  // One flood fill gives deterministic, connected, parcel-safe routes. No work per frame.
  const start=index(PLAZA_SPAWN),open=new Uint8Array(COLS*ROWS),parent=new Int32Array(COLS*ROWS).fill(-1);
  for(let i=0;i<open.length;i++){const [x,z]=point(i);open[i]=clearStreet(x,z)?1:0;}
  if(!open[start])throw new Error('Plaza arrival is blocked');
  const queue=[start];parent[start]=start;
  for(let n=0;n<queue.length;n++){
    const id=queue[n],x=id%COLS,z=Math.floor(id/COLS);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,nz=z+dz;if(nx<0||nx>=COLS||nz<0||nz>=ROWS)continue;
      const next=nz*COLS+nx;if(open[next]&&parent[next]===-1){parent[next]=id;queue.push(next);}
    }
  }
  const destinations:Point[]=[...CITY_BUILDINGS.map(b=>b.door),[-1.6,.5],[-9.9,.4],[-5,-.6],[-5.5,0],[-4.5,0]];
  const used=new Set<number>(),routes:Point[][]=[];
  for(const target of destinations){
    // Quantized endpoints must still land immediately outside the requested entrance.
    let end=-1,best=Infinity;
    for(const id of queue){const p=point(id),d=Math.hypot(p[0]-target[0],p[1]-target[1]);if(d<best){best=d;end=id;}}
    if(best>.16)throw new Error('No public path to '+target.join(','));
    const route:Point[]=[];while(end!==start){used.add(end);route.push(point(end));end=parent[end];}used.add(start);route.push(point(start));routes.push(route.reverse());
  }
  return {roads:[...used].map(point),routes,destinations};
}
export function nearbyLandmark(x:number,z:number):string|undefined {
  if(Math.hypot(x-PLAZA.x,z-PLAZA.z)<1.1)return PLAZA.name;
  const b=CITY_BUILDINGS.find(b=>Math.hypot(x-b.x,z-b.z)<.82);
  if(b)return b.name;
  if(Math.hypot(x,z)<2.05)return 'National Unity Monument';
  return undefined;
}
