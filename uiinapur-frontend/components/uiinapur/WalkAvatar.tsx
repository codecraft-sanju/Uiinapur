'use client';
/* eslint-disable react-hooks/immutability -- Imperative R3F simulation buffers are intentionally mutable; UI state is updated separately. */
import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AvatarMotion = { speed: number; grounded: boolean; phase: number };
export default function WalkAvatar({ motion }: { motion: RefObject<AvatarMotion> }) {
  const body = useRef<THREE.Group>(null), leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const m = motion.current;
    m.phase += Math.min(dt, .05) * (m.speed > 1.5 ? 15 : m.speed > .1 ? 10 : 2);
    const amplitude = m.speed > .1 ? Math.min(.75, m.speed * .4) : .025;
    const swing = Math.sin(m.phase) * amplitude;
    if (leftArm.current) leftArm.current.rotation.x = m.grounded ? -swing : -.8;
    if (rightArm.current) rightArm.current.rotation.x = m.grounded ? swing : -.8;
    if (leftLeg.current) leftLeg.current.rotation.x = m.grounded ? swing : .4;
    if (rightLeg.current) rightLeg.current.rotation.x = m.grounded ? -swing : -.35;
    if (body.current) body.current.position.y = m.grounded ? Math.abs(Math.sin(m.phase)) * (m.speed > .1 ? .012 : .003) : 0;
  });
  return <group ref={body}>
    <mesh position={[0, .42, 0]} castShadow><capsuleGeometry args={[.09, .15, 4, 10]}/><meshStandardMaterial color="#39796c" roughness={.65}/></mesh>
    <mesh position={[0, .455, .086]}><boxGeometry args={[.038, .038, .012]}/><meshStandardMaterial color="#f0c987" metalness={.5} roughness={.3}/></mesh>
    <mesh position={[0, .605, 0]} castShadow><sphereGeometry args={[.082, 16, 12]}/><meshStandardMaterial color="#d7ae91"/></mesh>
    <mesh position={[0, .65, -.008]} castShadow><sphereGeometry args={[.084, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color="#17252c"/></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .028, .614, .074]}><sphereGeometry args={[.009, 8, 6]}/><meshStandardMaterial color="#14242b"/></mesh>)}
    <mesh position={[0, .42, -.095]} castShadow><boxGeometry args={[.11, .14, .055]}/><meshStandardMaterial color="#203944"/></mesh>
    {[-1, 1].map(side => <group ref={side < 0 ? leftArm : rightArm} key={'arm' + side} position={[side * .13, .48, 0]}>
      <mesh position={[0, -.075, 0]} castShadow><capsuleGeometry args={[.031, .12, 4, 8]}/><meshStandardMaterial color="#39796c"/></mesh>
      <group position={[0, -.15, 0]} rotation={[-.18, 0, side * .05]}><mesh position={[0, -.035, 0]} castShadow><capsuleGeometry args={[.026, .06, 4, 8]}/><meshStandardMaterial color="#d7ae91"/></mesh></group>
    </group>)}
    {[-1, 1].map(side => <group ref={side < 0 ? leftLeg : rightLeg} key={'leg' + side} position={[side * .049, .29, 0]}>
      <mesh position={[0, -.095, 0]} castShadow><capsuleGeometry args={[.036, .14, 4, 8]}/><meshStandardMaterial color="#20323e"/></mesh>
      <mesh position={[0, -.24, .018]} castShadow><boxGeometry args={[.075, .055, .115]}/><meshStandardMaterial color="#c2d3c4" roughness={.8}/></mesh>
    </group>)}
  </group>;
}
