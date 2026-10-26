import { WALK, movement, type WalkInput } from './walk';

export type GameKey = { code?:string; key?:string; shiftKey?:boolean; repeat?:boolean; target?:EventTarget|null; preventDefault:()=>void };
const movementCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','KeyE']);
export function keyCode(event:GameKey) {
  if(event.code&&event.code!=='Unidentified')return event.code;
  const key=event.key?.toLowerCase();
  return key==='shift'?'ShiftLeft':key===' '?'Space':key==='escape'?'Escape':key&&'wasde'.includes(key)&&key.length===1?'Key'+key.toUpperCase():event.key||'';
}
export function resetMovement(input:WalkInput,keys?:Set<string>) {
  keys?.clear();input.x=input.y=0;input.run=input.jump=input.talk=input.shift=false;input.reset++;
}
export function toggleRun(input:WalkInput) { if(!input.blocked)input.run=!input.run;return input.run; }
export function joystickVector(x:number,y:number,radius:number) {
  const length=Math.hypot(x,y);if(radius<=0||length<radius*.08)return{x:0,y:0};
  const divisor=Math.max(radius,length);return{x:x/divisor,y:y/divisor};
}
export function readMovement(input:WalkInput,keys:Set<string>,yaw:number,paused=false) {
  const x=paused||input.blocked?0:Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+input.x;
  const forward=paused||input.blocked?0:Number(keys.has('KeyW'))-Number(keys.has('KeyS'))-input.y;
  const sprint=!paused&&!input.blocked&&(input.run||input.shift||keys.has('ShiftLeft')||keys.has('ShiftRight'));
  return {x,forward,dir:movement(x,forward,yaw),speed:sprint?WALK.runSpeed:WALK.speed,sprint};
}
export function createKeyboard(input:WalkInput,keys:Set<string>,blocked:()=>boolean,onEscape:()=>void) {
  return {
    down(e:GameKey){
      const code=keyCode(e);
      if(code==='Escape'){if(blocked()&&!input.blocked)return;e.preventDefault();resetMovement(input,keys);onEscape();return;}
      if(blocked()||input.blocked){resetMovement(input,keys);return;}
      // Synchronize modifier state on every movement key, including Shift held before mode entry.
      if(typeof e.shiftKey==='boolean'){input.shift=e.shiftKey;if(!e.shiftKey&&!code.startsWith('Shift')){keys.delete('ShiftLeft');keys.delete('ShiftRight');}}
      if(!movementCodes.has(code))return;
      e.preventDefault();keys.add(code);
      if(code.startsWith('Shift'))input.shift=true;
      if(code==='Space'&&!e.repeat)input.jump=true;
      if(code==='KeyE'&&!e.repeat)input.talk=true;
    },
    up(e:GameKey){
      const code=keyCode(e);keys.delete(code);
      if(typeof e.shiftKey==='boolean'){input.shift=e.shiftKey;if(!e.shiftKey){keys.delete('ShiftLeft');keys.delete('ShiftRight');}}
      else if(code.startsWith('Shift'))input.shift=keys.has('ShiftLeft')||keys.has('ShiftRight');
    },
    clear(){resetMovement(input,keys);},
  };
}

export function createCameraPointers(state:{yaw:number;pitch:number;distance:number}) {
  const points=new Map<number,{x:number;y:number}>();
  const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
  return {
    down(id:number,x:number,y:number){points.set(id,{x,y});},
    move(id:number,x:number,y:number){const p=points.get(id);if(!p)return;
      if(points.size===2){const other=[...points.entries()].find(([key])=>key!==id)?.[1];if(other)state.distance=clamp(state.distance+(Math.hypot(p.x-other.x,p.y-other.y)-Math.hypot(x-other.x,y-other.y))*.007,.9,4);}
      else if(points.size===1){state.yaw-=(x-p.x)*.005;state.pitch=clamp(state.pitch+(y-p.y)*.004,.12,1.15);}
      points.set(id,{x,y});
    },
    end(id:number){points.delete(id);},clear(){points.clear();},
  };
}
