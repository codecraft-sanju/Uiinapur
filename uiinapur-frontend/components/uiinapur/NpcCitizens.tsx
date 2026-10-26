'use client';
/* eslint-disable react-hooks/immutability -- Instance matrices and simulation buffers are updated outside React rendering. */
import { useEffect, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CITIZENS } from '@/lib/uiinapur/citizens';
import { animateAvatar } from '@/lib/uiinapur/avatarMotion';
import { createCrowd, type SocialSession } from '@/lib/uiinapur/social';
import { terrainSampler } from '@/lib/uiinapur/cityGeometry';

type Joint='body'|'leftArm'|'rightArm'|'leftLeg'|'rightLeg';
type Part={shape:'box'|'sphere'|'capsule';joint:Joint;p:[number,number,number];scale:[number,number,number];color:'shirt'|'skin'|'hair'|'pants'|'gold'|'eyes'|'shoes'};
// Same proportions and joint pivots as WalkAvatar; one draw call per part for all 16 citizens.
const PARTS:Part[]=[
 {shape:'capsule',joint:'body',p:[0,.42,0],scale:[.18,.33,.18],color:'shirt'},
 {shape:'box',joint:'body',p:[0,.455,.086],scale:[.038,.038,.012],color:'gold'},
 {shape:'sphere',joint:'body',p:[0,.605,0],scale:[.164,.164,.164],color:'skin'},
 {shape:'sphere',joint:'body',p:[0,.66,-.014],scale:[.17,.09,.16],color:'hair'},
 ...([-1,1] as const).map(side=>({shape:'sphere' as const,joint:'body' as const,p:[side*.028,.614,.074] as [number,number,number],scale:[.018,.018,.018] as [number,number,number],color:'eyes' as const})),
 ...(['leftArm','rightArm'] as const).flatMap(joint=>[
  {shape:'capsule' as const,joint,p:[0,-.075,0] as [number,number,number],scale:[.062,.182,.062] as [number,number,number],color:'shirt' as const},
  {shape:'capsule' as const,joint,p:[0,-.185,.006] as [number,number,number],scale:[.052,.112,.052] as [number,number,number],color:'skin' as const},
 ]),
 ...(['leftLeg','rightLeg'] as const).flatMap(joint=>[
  {shape:'capsule' as const,joint,p:[0,-.095,0] as [number,number,number],scale:[.072,.212,.072] as [number,number,number],color:'pants' as const},
  {shape:'box' as const,joint,p:[0,-.24,.018] as [number,number,number],scale:[.075,.055,.115] as [number,number,number],color:'shoes' as const},
 ]),
];
const pivots:Record<Joint,[number,number,number]>={body:[0,0,0],leftArm:[-.13,.48,0],rightArm:[.13,.48,0],leftLeg:[-.049,.29,0],rightLeg:[.049,.29,0]};
export default function NpcCitizens({environment,social}:{environment:RefObject<THREE.Group|null>;social:SocialSession}) {
  const meshes=useRef<(THREE.InstancedMesh|null)[]>([]),labels=useRef<(HTMLDivElement|null)[]>([]),anchors=useRef<(THREE.Group|null)[]>([]);
  const runtime=useRef<ReturnType<typeof createCrowd>|null>(null);
  const scratch=useRef({root:new THREE.Object3D(),joint:new THREE.Object3D(),part:new THREE.Object3D(),matrix:new THREE.Matrix4(),color:new THREE.Color()});
  useEffect(()=>()=>{runtime.current=null;social.agents=[];social.nearId=null;},[social]);
  useFrame((_,delta)=>{
    const world=environment.current;if(!world?.userData.cityReady)return;
    if(!runtime.current){
      const terrain=terrainSampler(world);
      runtime.current=createCrowd((x,z)=>{const hit=terrain(x,z);if(!hit)return null;return Math.max(hit.y,world.userData.citySurface?.(x,z)??-Infinity);});
      social.agents=runtime.current.agents;
      PARTS.forEach((p,j)=>{const mesh=meshes.current[j];if(!mesh)return;CITIZENS.forEach((c,i)=>{const color=p.color==='gold'?'#e4cb94':p.color==='eyes'?'#14242b':p.color==='shoes'?'#cad7cb':c.appearance[p.color];mesh.setColorAt(i,scratch.current.color.set(color));});if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;});
    }
    runtime.current.step(delta,social);
    const {root,joint,part,matrix}=scratch.current;
    const closest=[...social.agents].sort((a,b)=>Math.hypot(a.x-social.player.x,a.z-social.player.z)-Math.hypot(b.x-social.player.x,b.z-social.player.z)).slice(0,4).map(a=>a.index);
    for(const a of social.agents){
      const pose=animateAvatar(a.motion,delta);
      root.position.set(a.x,a.y+pose.bob,a.z);root.rotation.set(0,a.heading,0);root.updateMatrix();
      PARTS.forEach((p,j)=>{
        const mesh=meshes.current[j];if(!mesh)return;
        joint.position.set(...pivots[p.joint]);joint.rotation.set(p.joint==='leftArm'?pose.leftArm:p.joint==='rightArm'?pose.rightArm:p.joint==='leftLeg'?pose.leftLeg:p.joint==='rightLeg'?pose.rightLeg:0,0,p.joint==='rightArm'?pose.waveZ:0);joint.updateMatrix();
        part.position.set(...p.p);part.scale.set(p.scale[0]*(p.shape==='capsule'?2:1),p.scale[1],p.scale[2]*(p.shape==='capsule'?2:1));part.updateMatrix();matrix.copy(root.matrix).multiply(joint.matrix).multiply(part.matrix);mesh.setMatrixAt(a.index,matrix);mesh.visible=true;
      });
      const anchor=anchors.current[a.index],label=labels.current[a.index];
      if(anchor)anchor.position.set(a.x,a.y+.84,a.z);
      if(label){const visible=social.player.ready&&closest.includes(a.index)&&Math.hypot(a.x-social.player.x,a.z-social.player.z)<2.2;label.style.display=visible?'block':'none';label.dataset.near=String(social.nearId===CITIZENS[a.index].id);}
    }
    meshes.current.forEach(mesh=>{if(mesh)mesh.instanceMatrix.needsUpdate=true;});
  });
  return <group>
    {PARTS.map((p,i)=><instancedMesh key={i} ref={el=>{meshes.current[i]=el;}} args={[undefined,undefined,CITIZENS.length]} frustumCulled={false} visible={false}>
      {p.shape==='box'?<boxGeometry/>:p.shape==='sphere'?<sphereGeometry args={[.5,10,7]}/>:<capsuleGeometry args={[.25,.5,3,7]}/>}
      <meshStandardMaterial roughness={.75}/>
    </instancedMesh>)}
    {CITIZENS.map((c,i)=><group key={c.id} ref={el=>{anchors.current[i]=el;}}><Html center zIndexRange={[12,0]} style={{pointerEvents:'none'}}><div ref={el=>{labels.current[i]=el;}} className="npc-nameplate" style={{display:'none'}}>{c.name}<small>{c.home} · DEMO CITIZEN</small></div></Html></group>)}
  </group>;
}
