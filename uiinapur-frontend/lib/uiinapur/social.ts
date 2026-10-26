import { createCityPlan, clearStreet, cityObstacles, nearbyLandmark } from './city';
import { CITIZENS } from './citizens';
import type { AvatarMotion } from './avatarMotion';
import type { Point } from './data';

export type Agent={index:number;x:number;y:number;z:number;heading:number;node:number;path:number[];wait:number;visits:number;travelled:number;motion:AvatarMotion};
export type SocialSession={player:{x:number;y:number;z:number;ready:boolean};activeId:string|null;nearId:string|null;waveRequest:number;playerWave:number;agents:Agent[];onNearby:(id:string|null)=>void;onTalk:(id:string|null)=>void};
export const freshSocial=(onNearby:SocialSession['onNearby'],onTalk:SocialSession['onTalk']):SocialSession=>({player:{x:0,y:0,z:0,ready:false},activeId:null,nearId:null,waveRequest:0,playerWave:0,agents:[],onNearby,onTalk});
const key=([x,z]:Point)=>Math.round(x*10)+','+Math.round(z*10);
export function lineOfSight(a:Point,b:Point) {
  const steps=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.035));
  for(let i=1;i<steps;i++){
    const x=a[0]+(b[0]-a[0])*i/steps,z=a[1]+(b[1]-a[1])*i/steps;
    if(cityObstacles.some(o=>Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2))return false;
  }
  return true;
}
export function createCrowd(sample:(x:number,z:number)=>number|null) {
  const plan=createCityPlan();
  const nodes=plan.roads.filter(([x,z])=>clearStreet(x,z)&&sample(x,z)!==null);
  const lookup=new Map(nodes.map((p,i)=>[key(p),i]));
  const heights=nodes.map(([x,z])=>sample(x,z)!);
  const edges=nodes.map(([x,z],i)=>[[.1,0],[-.1,0],[0,.1],[0,-.1]].map(([dx,dz])=>lookup.get(key([x+dx,z+dz]))).filter((n):n is number=>n!==undefined&&Math.abs(heights[n]-heights[i])<.08));
  function closest(p:Point){let best=0,d=Infinity;nodes.forEach((q,i)=>{const v=Math.hypot(q[0]-p[0],q[1]-p[1]);if(v<d){d=v;best=i;}});return best;}
  function route(start:number,end:number){
    const parents=new Int32Array(nodes.length).fill(-1),queue=[start];parents[start]=start;
    for(let i=0;i<queue.length&&parents[end]===-1;i++)for(const n of edges[queue[i]])if(parents[n]===-1){parents[n]=queue[i];queue.push(n);}
    if(parents[end]===-1)return[];
    const result:number[]=[];for(let n=end;n!==start;n=parents[n])result.push(n);return result.reverse();
  }
  const stops=plan.routes.map(r=>closest(r[r.length-1]));
  const seeds:Point[]=[[-5.5,0],[-5.5,.4],[-4.5,0],[-4.5,.4],[-5,-.6],[-5.4,-.5],[-9.6,0],[-8.6,0],[-7.6,0],[-6.6,0],[-3.5,0],[-2.5,0],[-8,.2],[-7,.3],[-3,.3],[-2,.3]];
  const occupied:number[]=[];
  const agents:Agent[]=CITIZENS.map((_,i)=>{
    const preferred=closest(seeds[i]);
    const order=nodes.map((_,n)=>n).sort((a,b)=>Math.hypot(nodes[a][0]-nodes[preferred][0],nodes[a][1]-nodes[preferred][1])-Math.hypot(nodes[b][0]-nodes[preferred][0],nodes[b][1]-nodes[preferred][1]));
    const node=order.find(n=>occupied.every(o=>Math.hypot(nodes[o][0]-nodes[n][0],nodes[o][1]-nodes[n][1])>.24))??preferred;occupied.push(node);
    const [x,z]=nodes[node];return{index:i,x,y:heights[node],z,heading:i*.7,node,path:[],wait:i<6?2+i*.4:i*.07,visits:0,travelled:0,motion:{speed:0,grounded:true,phase:i*.8,wave:i%3===0?1.8:0}};
  });
  let lastWave=0;
  return {agents,nodes,edges,route,step(delta:number,s:SocialSession){
    const dt=Math.min(delta,.05);
    for(const a of agents){
      const selected=s.activeId===CITIZENS[a.index].id;
      if(selected){
        a.motion.speed=0;
        const angle=Math.atan2(s.player.x-a.x,s.player.z-a.z);a.heading+=Math.atan2(Math.sin(angle-a.heading),Math.cos(angle-a.heading))*(1-Math.exp(-9*dt));
        if(s.waveRequest!==lastWave)a.motion.wave=2.4;
        continue;
      }
      if(a.wait>0){
        a.wait-=dt;a.motion.speed=0;
        const neighbor=agents.find(b=>b.index!==a.index&&b.wait>0&&Math.hypot(b.x-a.x,b.z-a.z)<.65);
        if(neighbor){const angle=Math.atan2(neighbor.x-a.x,neighbor.z-a.z);a.heading+=Math.atan2(Math.sin(angle-a.heading),Math.cos(angle-a.heading))*(1-Math.exp(-3*dt));}
        continue;
      }
      if(!a.path.length){
        a.visits++;const destination=stops[(a.index*3+a.visits*5)%stops.length];a.path=route(a.node,destination);
        if(!a.path.length){a.wait=.4;continue;}
      }
      const target=a.path[0],[tx,tz]=nodes[target],dx=tx-a.x,dz=tz-a.z,length=Math.hypot(dx,dz);
      const travel=Math.min(length,(.27+(a.index%5)*.035)*dt),nx=a.x+dx/Math.max(length,1e-8)*travel,nz=a.z+dz/Math.max(length,1e-8)*travel;
      // Player has priority. Citizens yield briefly rather than pushing the avatar off a narrow path.
      if(s.player.ready&&Math.hypot(nx-s.player.x,nz-s.player.z)<.25){a.motion.speed=0;continue;}
      const oldX=a.x,oldZ=a.z;a.x=nx;a.z=nz;a.y+=(heights[target]-a.y)*Math.min(1,dt*14);
      a.motion.speed=Math.hypot(nx-oldX,nz-oldZ)/Math.max(dt,.001);a.travelled+=travel;
      if(length>1e-6){const angle=Math.atan2(dx,dz);a.heading+=Math.atan2(Math.sin(angle-a.heading),Math.cos(angle-a.heading))*(1-Math.exp(-10*dt));}
      if(length<=travel+1e-6){a.node=target;a.path.shift();if(!a.path.length){a.wait=2+(a.index+a.visits)%5;if((a.index+a.visits)%3===0)a.motion.wave=2.2;}}
    }
    lastWave=s.waveRequest;
    let nearest:string|null=null,best=.85;
    if(s.player.ready)for(const a of agents){const distance=Math.hypot(a.x-s.player.x,a.z-s.player.z);if(distance<best&&Math.abs(a.y-s.player.y)<.4&&lineOfSight([s.player.x,s.player.z],[a.x,a.z])){best=distance;nearest=CITIZENS[a.index].id;}}
    if(nearest!==s.nearId){s.nearId=nearest;s.onNearby(nearest);}
    if(s.activeId){const active=agents.find(a=>CITIZENS[a.index].id===s.activeId);if(!active||Math.hypot(active.x-s.player.x,active.z-s.player.z)>1.25)s.onTalk(null);}
  },location(index:number){const a=agents[index];return nearbyLandmark(a.x,a.z)||'the plaza promenade';}};
}
