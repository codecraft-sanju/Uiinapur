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
