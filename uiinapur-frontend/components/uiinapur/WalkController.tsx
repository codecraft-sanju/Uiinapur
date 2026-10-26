'use client';
/* eslint-disable react-hooks/immutability -- Imperative R3F simulation buffers are intentionally mutable; UI state is updated separately. */
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { inside, plots, territories } from '@/lib/uiinapur/data';
import { dryFootprint, verticalStep, WALK, type WalkInput, type WalkStatus } from '@/lib/uiinapur/walk';
import { PLAZA_SPAWN, nearbyLandmark, publicLand } from '@/lib/uiinapur/city';
import { createCameraPointers, createKeyboard, readMovement } from '@/lib/uiinapur/walkInput';
import { CITIZENS } from '@/lib/uiinapur/citizens';
import type { SocialSession } from '@/lib/uiinapur/social';
import WalkAvatar, { type AvatarMotion } from './WalkAvatar';

export type WalkSession = { input: WalkInput; social:SocialSession; onStatus: (status: WalkStatus) => void; onExit: () => void };
type Props = WalkSession & { environment: RefObject<THREE.Group | null>; region: string; selected: string | null };
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);

export default function WalkController({ environment, region, selected, input, social, onStatus, onExit }: Props) {
  const { camera, gl } = useThree();
  const avatar = useRef<THREE.Group>(null);
  const motion = useRef<AvatarMotion>({ speed: 0, grounded: true, phase: 0 });
  const state = useMemo(() => ({ position: new THREE.Vector3(), velocity: 0, grounded: true, initialized: false,
    failed: false, elapsed: 0, yaw: .6, pitch: .3, distance: 2.1, heading: 0, lastStatus: '', reset: 0, plazaSeen: 0,
    keys: new Set<string>(), ground: [] as THREE.Object3D[], solids: [] as THREE.Object3D[], all: [] as THREE.Object3D[],
    boxes: [] as THREE.Box3[], body: new THREE.Box3(), ray: new THREE.Raycaster(), origin: new THREE.Vector3(), direction: new THREE.Vector3(), target: new THREE.Vector3(),
    desired: new THREE.Vector3(), start: new THREE.Vector3(), startQ: new THREE.Quaternion(), goalQ: new THREE.Quaternion(),
    dummy: new THREE.Object3D(), normal: new THREE.Vector3(), spawn: new THREE.Vector3() }), []);

  useEffect(() => {
    const canvas = gl.domElement, pointers = createCameraPointers(state);
    const previousTouch = canvas.style.touchAction, previousCursor = canvas.style.cursor;
    const originalNear = camera instanceof THREE.PerspectiveCamera ? camera.near : .1;
    if (camera instanceof THREE.PerspectiveCamera) { camera.near = .035; camera.updateProjectionMatrix(); }
    canvas.style.touchAction = 'none'; canvas.style.cursor = 'grab';
    const editing = () => !!document.activeElement?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]') || !!document.querySelector('[role="dialog"][aria-modal="true"]');
    const keyboard=createKeyboard(input,state.keys,editing,()=>{if(social.activeId)social.onTalk(null);else onExit();});
    const clear=()=>{keyboard.clear();state.reset=input.reset;pointers.clear();};
    const keydown=(e:KeyboardEvent)=>{if(state.reset!==input.reset){state.keys.clear();state.reset=input.reset;}keyboard.down(e);},keyup=(e:KeyboardEvent)=>keyboard.up(e);
    const focus=()=>{if(editing())clear();};
    const down = (e: PointerEvent) => { if(input.blocked)return; if (e.pointerType === 'mouse' && e.button !== 0) return; pointers.down(e.pointerId,e.clientX,e.clientY); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => {if(!input.blocked)pointers.move(e.pointerId,e.clientX,e.clientY);};
    const end = (e: PointerEvent) => { pointers.end(e.pointerId); if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); canvas.style.cursor = 'grab'; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); if(input.blocked)return; state.distance = THREE.MathUtils.clamp(state.distance + e.deltaY*(e.deltaMode===1?.03:.002), .9, 4); };
    const visibility = () => { if (document.hidden) clear(); };
    window.addEventListener('keydown',keydown,true); window.addEventListener('keyup',keyup,true);document.addEventListener('focusin',focus); window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',visibility);
    canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',move); canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end); canvas.addEventListener('lostpointercapture',end); canvas.addEventListener('wheel',wheel,{passive:false});
    return () => {
      social.player.ready=false;clear(); window.removeEventListener('keydown',keydown,true); window.removeEventListener('keyup',keyup,true);document.removeEventListener('focusin',focus); window.removeEventListener('blur',clear); document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointerdown',down); canvas.removeEventListener('pointermove',move); canvas.removeEventListener('pointerup',end); canvas.removeEventListener('pointercancel',end); canvas.removeEventListener('lostpointercapture',end); canvas.removeEventListener('wheel',wheel);
      canvas.style.touchAction=previousTouch; canvas.style.cursor=previousCursor;
      if (camera instanceof THREE.PerspectiveCamera) { camera.near=originalNear; camera.updateProjectionMatrix(); }
    };
  }, [camera,gl,input,onExit,state,social]);

  function height(x:number,z:number) {
    state.origin.set(x, 30, z); state.ray.set(state.origin, DOWN); state.ray.far=40;
    const hit=state.ray.intersectObjects(state.ground,false)[0];
    if (!hit?.face) return null;
    state.normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    const pavement=environment.current?.userData.citySurface?.(x,z) as number|undefined;
    return {y:Math.max(hit.point.y,pavement??-Infinity), slope:state.normal.y};
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
  function plazaSpawn() {
    for(let i=0;i<160;i++){
      const r=.035*Math.sqrt(i),a=i*2.399963,x=PLAZA_SPAWN[0]+Math.cos(a)*r,z=PLAZA_SPAWN[1]+Math.sin(a)*r;
      if(!publicLand(x,z,WALK.radius))continue;
      const spawn=safeSpawn(x,z);if(spawn)return spawn;
    }
    return null;
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
    if(!avatar.current||!environment.current||!environment.current.userData.cityReady||state.failed)return;
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
      let spawn:THREE.Vector3|null=plazaSpawn();
      for(let i=0;i<700&&!spawn;i++) {const r=.16*Math.sqrt(i),a=i*2.399963; const x=center[0]+Math.cos(a)*r,z=center[1]+Math.sin(a)*r;if(inside([x,z],territory.points))spawn=safeSpawn(x,z);}
      if(!spawn){state.failed=true;onStatus({territory:territory.name,motion:'Unavailable'});return;}
      state.position.copy(spawn);state.spawn.copy(spawn);state.start.copy(camera.position);state.startQ.copy(camera.quaternion);
      state.elapsed=matchMedia('(prefers-reduced-motion: reduce)').matches?1.2:0;state.initialized=true;
      avatar.current.visible=true;
    }
    if(input.plaza!==state.plazaSeen){
      state.plazaSeen=input.plaza;const destination=plazaSpawn();
      if(destination){state.position.copy(destination);state.spawn.copy(destination);state.velocity=0;state.grounded=true;state.keys.clear();input.x=input.y=0;input.run=input.jump=false;state.start.copy(camera.position);state.startQ.copy(camera.quaternion);state.elapsed=matchMedia('(prefers-reduced-motion: reduce)').matches?1.2:0;}
    }
    social.player.x=state.position.x;social.player.y=state.position.y;social.player.z=state.position.z;social.player.ready=true;
    if(input.talk){input.talk=false;if(social.nearId&&!social.activeId)social.onTalk(social.nearId);}
    const partner=social.activeId?social.agents.find(a=>CITIZENS[a.index].id===social.activeId):undefined;
    const dt=Math.min(delta,.05);state.elapsed+=dt;
    const entering=state.elapsed<1.2;
    if(input.reset!==state.reset){state.keys.clear();state.reset=input.reset;}
    const {x,forward,dir,speed}=readMovement(input,state.keys,state.yaw,entering);
    if(input.jump&&state.grounded&&!entering&&!input.blocked){state.velocity=WALK.jumpSpeed;state.grounded=false;}input.jump=false;
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
    if(partner){const angle=Math.atan2(partner.x-state.position.x,partner.z-state.position.z);state.heading+=Math.atan2(Math.sin(angle-state.heading),Math.cos(angle-state.heading))*(1-Math.exp(-10*dt));}
    if(social.playerWave>0){motion.current.wave=social.playerWave;social.playerWave=0;}
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
    const mode:WalkStatus['motion']=entering?'Entering':!state.grounded?'Jumping':actual>.05?(actual>WALK.speed*1.15?'Running':'Walking'):'Idle';
    const landmark=nearbyLandmark(state.position.x,state.position.z);
    const key=name+mode+(landmark||'')+input.run;if(key!==state.lastStatus){state.lastStatus=key;onStatus({territory:name,motion:mode,landmark,runEnabled:input.run,speed:actual});}
  });
  return <group ref={avatar} visible={false}><WalkAvatar motion={motion}/></group>;
}
