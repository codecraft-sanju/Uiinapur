'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Hand, MessageCircle, UserRound, MapPin } from 'lucide-react';
import { citizenReply, type Citizen, type ReplyKind } from '@/lib/uiinapur/citizens';

export default function CitizenDialog({citizen,location,onClose,onWave}:{citizen:Citizen;location:string;onClose:()=>void;onWave:()=>void}) {
  const panel=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null);
  const [profile,setProfile]=useState(false),[turn,setTurn]=useState(0),[exchange,setExchange]=useState<{player:string;npc:string}|null>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;close.current?.focus();
    const trap=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onClose();return;}
      if(event.key!=='Tab')return;
      const buttons=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),[tabindex="0"]')||[]);
      const first=buttons[0],last=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    const node=panel.current;node?.addEventListener('keydown',trap);
    return()=>{node?.removeEventListener('keydown',trap);if(previous?.isConnected)previous.focus();};
  },[onClose]);
  function reply(kind:ReplyKind) {
    setExchange({player:kind==='hello'?'Hello!':kind==='wave'?'You wave.':'Tell me about this place.',npc:citizenReply(citizen,kind,location,turn)});
    setTurn(n=>n+1);if(kind==='wave'||kind==='hello')onWave();
  }
  const a=citizen.appearance;
  return <div className="citizen-overlay" onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div ref={panel} className="citizen-card" role="dialog" aria-modal="true" aria-labelledby="citizen-title" aria-describedby="citizen-demo">
      <button ref={close} onClick={onClose} className="citizen-close" aria-label="Close citizen conversation"><X size={19}/></button>
      <div className="citizen-kicker" id="citizen-demo">SIMULATED DEMO CITIZEN · SCRIPTED DIALOGUE</div>
      <div className="citizen-heading">
        <svg className="citizen-portrait" viewBox="0 0 100 100" role="img" aria-label={`${citizen.name} avatar`}><rect width="100" height="100" rx="24" fill="#173535"/><path d="M17 100V80Q17 62 50 62Q83 62 83 80V100" fill={a.shirt}/><rect x="43" y="55" width="14" height="18" rx="5" fill={a.skin}/><ellipse cx="50" cy="40" rx="21" ry="26" fill={a.skin}/><path d="M29 39Q24 11 50 12Q76 11 71 39L64 26Q49 36 31 29Z" fill={a.hair}/><circle cx="42" cy="42" r="2" fill="#183039"/><circle cx="59" cy="42" r="2" fill="#183039"/><path d="M43 54Q50 59 57 54" fill="none" stroke="#805344" strokeWidth="2"/><circle cx="69" cy="83" r="5" fill="#e7c991"/></svg>
        <div><small>{citizen.role}</small><h2 id="citizen-title">{citizen.name}</h2><p><MapPin size={13}/>{citizen.home}</p></div>
      </div>
      <div className="citizen-number">FICTIONAL CITIZEN NUMBER <strong>{citizen.id}</strong></div>
      <p className="citizen-personality">{citizen.personality}</p>
      <div className="citizen-dialogue" aria-live="polite" aria-atomic="true">{exchange?<><small>YOU · {exchange.player}</small><p>{exchange.npc}</p></>:<p>{citizen.name} turns toward you. Say hello or send a friendly wave.</p>}</div>
      <div className="citizen-actions"><button onClick={()=>reply('hello')}><MessageCircle size={16}/>Say Hello</button><button onClick={()=>reply('wave')}><Hand size={16}/>Wave</button><button aria-expanded={profile} onClick={()=>setProfile(v=>!v)}><UserRound size={16}/>{profile?'Hide Profile':'View Profile'}</button></div>
      <button className="citizen-context" onClick={()=>reply('place')}>Tell me about {location}</button>
      {profile&&<dl className="citizen-profile"><div><dt>Home state</dt><dd>{citizen.home}</dd></div><div><dt>Favorite pastime</dt><dd>{citizen.role}</dd></div><div><dt>Here today</dt><dd>Exploring {location}</dd></div><div><dt>About this character</dt><dd>A fictional local demo character. No real person, online presence or message delivery.</dd></div></dl>}
      <footer>Esc to close · Walking resumes after you close this card</footer>
    </div>
  </div>;
}
