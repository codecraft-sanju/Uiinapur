'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { Building } from '@/lib/uiinapur/data';
export const dimensions = (name: string): [
    number,
    number,
    number
] => name === 'Luxury tower' ? [.4, 1.8, .4] : name === 'Futuristic HQ' ? [.48, 1.2, .42] : name === 'Modern villa' ? [.54, .4, .42] : name === 'Commercial shop' ? [.52, .32, .5] : name === 'Creative studio' ? [.38, .65, .5] : [.42, .5, .42];
export default function BuildingPreview({ building: b }: {
    building: Building;
}) { const [w, h, d] = dimensions(b.template); return <div className="real-building-preview"><Canvas camera={{ position: [2, 1.7, 2], fov: 40 }} dpr={[1, 1.5]}><ambientLight intensity={2}/><directionalLight position={[3, 5, 2]} intensity={3}/><group rotation={[0, b.rotation * Math.PI / 180, 0]}><mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]}/><meshStandardMaterial color={b.wall}/></mesh><mesh position={[0, h + .03, 0]}><boxGeometry args={[w + .04, .08, d + .04]}/><meshStandardMaterial color={b.roof}/></mesh>{Array.from({ length: Math.max(1, Math.floor(h / .25)) }, (_, i) => <mesh key={i} position={[0, .16 + i * .25, d / 2 + .002]}><boxGeometry args={[w * .65, .09, .01]}/><meshStandardMaterial color="#568d98" metalness={.7} roughness={.2}/></mesh>)}</group><mesh position={[0, -.045, 0]}><boxGeometry args={[.72, .09, .72]}/><meshStandardMaterial color="#496b5b"/></mesh>{b.garden && <mesh position={[.27, .18, -.27]}><coneGeometry args={[.1, .38, 6]}/><meshStandardMaterial color="#347d53"/></mesh>}<Grid position={[0, -.1, 0]} args={[6, 6]} cellColor="#254b4f" sectionColor="#345d5b" fadeDistance={5}/><OrbitControls enablePan={false} minDistance={1.2} maxDistance={4} maxPolarAngle={Math.PI / 2.1}/></Canvas><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div>; }
