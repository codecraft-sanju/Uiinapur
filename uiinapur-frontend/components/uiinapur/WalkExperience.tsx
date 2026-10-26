'use client';
/* eslint-disable react-hooks/immutability -- Shared imperative input/session buffers; React state only renders HUD changes. */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ArrowUpRight, Footprints, LogOut, ArrowUp, Zap, MapPin, RotateCcw, MessageCircle } from 'lucide-react';
import World, { type WorldProps } from './World';
import CitizenDialog from './CitizenDialog';
import { freshWalkInput, type WalkStatus } from '@/lib/uiinapur/walk';
import { joystickVector, resetMovement, toggleRun } from '@/lib/uiinapur/walkInput';
import { freshSocial } from '@/lib/uiinapur/social';
import { CITIZENS } from '@/lib/uiinapur/citizens';
import { nearbyLandmark } from '@/lib/uiinapur/city';

export default function WalkExperience(props:WorldProps) {
  const [active,setActive]=useState(false),[nearby,setNearby]=useState<string|null>(null),[conversation,setConversation]=useState<string|null>(null);
  const [status,setStatus]=useState<WalkStatus>({territory:'Uiinapur',motion:'Entering',runEnabled:false});
  const input=useMemo(()=>freshWalkInput(),[]);
  const social=useMemo(()=>{
    const value=freshSocial(setNearby,id=>{value.activeId=id;resetMovement(input);input.blocked=!!id;setConversation(id);setStatus(s=>({...s,runEnabled:false}));});
    return value;
  },[input]);
  const knob=useRef<HTMLSpanElement>(null),joystickPointer=useRef<number|null>(null);
  const resetJoystick=useCallback(()=>{input.x=input.y=0;joystickPointer.current=null;if(knob.current)knob.current.style.transform='translate(-50%, -50%)';},[input]);
  const closeTalk=useCallback(()=>{social.onTalk(null);resetJoystick();},[social,resetJoystick]);
  const exit=useCallback(()=>{social.onTalk(null);social.player.ready=false;social.nearId=null;resetJoystick();Object.assign(input,freshWalkInput());setNearby(null);setActive(false);},[input,social,resetJoystick]);
  const session=useMemo(()=>({input,social,onStatus:setStatus,onExit:exit}),[input,social,exit]);
  useEffect(()=>{
    const clear=()=>{resetJoystick();resetMovement(input);setStatus(s=>({...s,runEnabled:false}));};
    const visibility=()=>{if(document.hidden)clear();};
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);};
  },[input,resetJoystick]);
  function joystick(e:PointerEvent<HTMLDivElement>) {
    if(joystickPointer.current!==e.pointerId||input.blocked)return;
    const rect=e.currentTarget.getBoundingClientRect(),radius=rect.width*.32;
    const vector=joystickVector(e.clientX-rect.left-rect.width/2,e.clientY-rect.top-rect.height/2,radius);
    input.x=vector.x;input.y=vector.y;
    if(knob.current)knob.current.style.transform=`translate(calc(-50% + ${vector.x*radius}px),calc(-50% + ${vector.y*radius}px))`;
  }
  function plaza(){social.onTalk(null);resetJoystick();input.plaza++;}
  const citizen=CITIZENS.find(c=>c.id===conversation),near=CITIZENS.find(c=>c.id===nearby);
  const agent=citizen?social.agents.find(a=>CITIZENS[a.index].id===citizen.id):undefined;
  const location=agent?nearbyLandmark(agent.x,agent.z)||'the plaza promenade':'the National Plaza';
  return <div className={'walk-experience '+(active?'walk-active':'')}>
    <div className="walk-scene" inert={!!citizen}>
      <World {...props} walk={active?session:undefined}/>
      {!active?<button className="walk-entry" onClick={()=>{setStatus({territory:'Uiinapur',motion:'Entering',runEnabled:false});setActive(true);}}><Footprints size={18}/><span>Walk Into Uiinapur<small>SEE THE WORLD AT YOUR OWN PACE</small></span><ArrowUpRight size={18}/></button>:<>
        <section className="walk-hud" aria-label="Walk Mode controls"><div className="walk-identity"><Footprints size={20}/><div><small>ON FOOT / {status.motion.toUpperCase()}</small><strong>{status.territory}</strong><span className="npc-demo-badge">16 simulated demo citizens</span></div></div><div className="walk-hud-actions"><button className="walk-plaza" onClick={plaza}><MapPin size={16}/>Visit National Plaza</button><button onClick={exit} className="walk-exit"><LogOut size={16}/>Exit Walk Mode</button></div></section>
        {status.landmark&&<div className="walk-landmark" aria-live="polite"><span>YOU ARE EXPLORING</span><strong>{status.landmark}</strong><small>UIINAPUR · PUBLIC REALM</small></div>}
        <button className="walk-return" onClick={plaza}><RotateCcw size={13}/>Return to plaza</button>
        {near&&<button className="citizen-interact" onClick={()=>{resetJoystick();social.onTalk(near.id);}}><MessageCircle size={17}/><span><em>Press </em><kbd>E</kbd><em> to talk</em><b>Interact</b> · {near.name}</span></button>}
        {status.motion==='Unavailable'?<div className="walk-help" role="alert">No safe spawn found here. Exit and select another territory.</div>:<div className="walk-help"><span><kbd>W A S D</kbd> Walk</span><span><kbd>SHIFT</kbd> Run · 1.7×</span><span><kbd>SPACE</kbd> Jump</span><span>Drag to look · Scroll to zoom · Esc to exit</span></div>}
        <div className="walk-mobile"><div className="walk-joystick" role="group" aria-label="Movement joystick" onPointerDown={e=>{if(joystickPointer.current!==null||input.blocked)return;joystickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);joystick(e);}} onPointerMove={joystick} onPointerUp={resetJoystick} onPointerCancel={resetJoystick} onLostPointerCapture={resetJoystick}><span ref={knob}/><small>MOVE</small></div><p>Drag the world to look<br/>Pinch to zoom</p><div className="walk-mobile-actions"><button className={status.runEnabled?'is-running':''} aria-label="Toggle run" aria-pressed={!!status.runEnabled} onClick={()=>{const enabled=toggleRun(input);setStatus(s=>({...s,runEnabled:enabled}));}}><Zap size={21}/>Run {status.runEnabled?'ON':'OFF'}</button><button aria-label="Jump" onPointerDown={()=>{if(!input.blocked)input.jump=true;}} onClick={e=>{if(e.detail===0&&!input.blocked)input.jump=true;}}><ArrowUp size={23}/>Jump</button></div></div>
      </>}
    </div>
    {citizen&&<CitizenDialog key={citizen.id} citizen={citizen} location={location} onClose={closeTalk} onWave={()=>{social.waveRequest++;social.playerWave=2.4;}}/>}
  </div>;
}
