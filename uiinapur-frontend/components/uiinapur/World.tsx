'use client';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { MapControls, Html, Line } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { dimensions } from './BuildingPreview';
type Controls = React.ElementRef<typeof MapControls>;
import { territories, plots, territory, hash, type Plot } from '@/lib/uiinapur/data';
import { useNation } from '@/lib/uiinapur/store';
type Props = {
    selected: string | null;
    region: string;
    onSelect: (id: string) => void;
    onRegion: (id: string) => void;
    view: number;
    status: string;
    onFail: () => void;
};
function Ground() { const shapes = useMemo(() => territories.map(t => { const s = new THREE.Shape(); t.points.forEach(([x, z], i) => i ? s.lineTo(x, -z) : s.moveTo(x, -z)); s.closePath(); return s; }), []); return <>{territories.map((t, i) => <group key={t.id}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .25, 0]} receiveShadow><extrudeGeometry args={[shapes[i], { depth: .7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .12, bevelThickness: .15 }]}/><meshStandardMaterial color={t.color} roughness={.9} metalness={.12}/></mesh><Line points={[...t.points, t.points[0]].map(([x, z]) => [x, 1.13, z])} color={t.color} lineWidth={1.4} transparent opacity={.85}/></group>)}</>; }
function Buildings({ items }: {
    items: Plot[];
}) { const walls = useRef<THREE.InstancedMesh>(null); const roofs = useRef<THREE.InstancedMesh>(null); const occupied = useMemo(() => items.filter(p => p.building), [items]); useEffect(() => { if (!walls.current || !roofs.current)
    return; const o = new THREE.Object3D(); occupied.forEach((p, i) => { const b = p.building!, [w, h, d] = dimensions(b.template); o.position.set(p.x, 1.12 + h / 2, p.z); o.rotation.set(0, b.rotation * Math.PI / 180, 0); o.scale.set(w, h, d); o.updateMatrix(); walls.current!.setMatrixAt(i, o.matrix); walls.current!.setColorAt(i, new THREE.Color(b.wall)); o.position.y = 1.12 + h + .08; o.scale.set(w + .04, .08, d + .04); o.updateMatrix(); roofs.current!.setMatrixAt(i, o.matrix); roofs.current!.setColorAt(i, new THREE.Color(b.roof)); }); walls.current.instanceMatrix.needsUpdate = true; roofs.current.instanceMatrix.needsUpdate = true; if (walls.current.instanceColor)
    walls.current.instanceColor.needsUpdate = true; if (roofs.current.instanceColor)
    roofs.current.instanceColor.needsUpdate = true; }, [occupied]); return <><instancedMesh ref={walls} args={[undefined, undefined, occupied.length]} castShadow><boxGeometry /><meshStandardMaterial roughness={.6}/></instancedMesh><instancedMesh ref={roofs} args={[undefined, undefined, occupied.length]} castShadow><boxGeometry /><meshStandardMaterial metalness={.4} roughness={.4}/></instancedMesh></>; }
function Parcels({ onSelect, selected, status }: Pick<Props, 'onSelect' | 'selected' | 'status'>) { const changes = useNation(s => s.changes), citizen = useNation(s => s.citizen); const items = useMemo(() => plots.map(p => ({ ...p, ...changes[p.id] })), [changes]); const visible = useMemo(() => items.filter(p => status === 'all' || (status === 'available' && !p.owner) || (status === 'owned' && p.owner === citizen?.id) || (status === 'listed' && p.listed)), [items, status, citizen]); const mesh = useRef<THREE.InstancedMesh>(null); const [hover, setHover] = useState<Plot | null>(null); useEffect(() => { if (!mesh.current)
    return; const o = new THREE.Object3D(); visible.forEach((p, i) => { o.position.set(p.x, 1.09, p.z); o.scale.set(.67, .035, .67); o.updateMatrix(); mesh.current!.setMatrixAt(i, o.matrix); const col = p.owner === citizen?.id ? '#84ffe0' : p.listed ? '#f2d79b' : p.owner ? '#647776' : territory(p.territory).color; mesh.current!.setColorAt(i, new THREE.Color(col).multiplyScalar(p.owner?.startsWith('citizen') ? .6 : .85)); }); mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor)
    mesh.current.instanceColor.needsUpdate = true; }, [visible, citizen]); const handle = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); const p = visible[e.instanceId ?? 0]; if (hover?.id !== p?.id)
    setHover(p); }; const selectedPlot = selected ? items.find(p => p.id === selected) : null; return <><instancedMesh ref={mesh} args={[undefined, undefined, visible.length]} onPointerMove={handle} onPointerOut={() => setHover(null)} onClick={e => { e.stopPropagation(); if (e.delta < 5)
    onSelect(visible[e.instanceId ?? 0].id); }}><boxGeometry /><meshStandardMaterial roughness={.8}/></instancedMesh><Buildings items={items}/>{[hover, selectedPlot].map((p, i) => p && <group key={i} position={[p.x, 1.15, p.z]}><Line points={[[-.38, 0, -.38], [.38, 0, -.38], [.38, 0, .38], [-.38, 0, .38], [-.38, 0, -.38]]} color="#eafff6" lineWidth={2}/>{i === 0 && <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none' }}><div className="map-tooltip">{p.id}<small>{p.owner ? 'Citizen owned' : 'Available to discover'}</small></div></Html>}</group>)}</>; }
function Landscape() { return <>{Array.from({ length: 32 }, (_, i) => { const x = -5 + hash(i + 3) * 10, z = -11 - hash(i + 76) * 2, h = 1.2 + hash(i + 4) * 2.8; return <mesh key={'m' + i} position={[x, h / 2 + 1, z]} rotation={[0, hash(i) * 3, 0]} castShadow><coneGeometry args={[.8 + hash(i), h, 5]}/><meshStandardMaterial color={i % 3 === 0 ? '#b6c5b5' : '#4e7868'} roughness={1}/></mesh>; })}{Array.from({ length: 75 }, (_, i) => { const p = plots[i * 11 % plots.length]; return <mesh key={'t' + i} position={[p.x + .3, 1.5, p.z + .3]} castShadow><coneGeometry args={[.18, .8, 5]}/><meshStandardMaterial color="#205b4e"/></mesh>; })}<group position={[0, 1.1, 0]}><mesh position={[0, .25, 0]}><cylinderGeometry args={[1.1, 1.35, .5, 6]}/><meshStandardMaterial color="#b1c7be"/></mesh><mesh position={[0, 1.65, 0]}><cylinderGeometry args={[.27, .6, 2.5, 6]}/><meshStandardMaterial color="#dedccb" metalness={.5} roughness={.3}/></mesh><mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[.5]}/><meshStandardMaterial color="#8cf5da" emissive="#2aa58a" emissiveIntensity={.5}/></mesh></group><Line points={[[-6, 1.13, -9], [-5, 1.13, -7], [-3, 1.13, -5], [-1, 1.13, -4], [0, 1.13, -2], [2, 1.13, -1], [4, 1.13, 2], [6, 1.13, 4], [8, 1.13, 5]]} color="#264d5d" lineWidth={8}/></>; }
function Camera({ region, selected, view }: Pick<Props, 'region' | 'selected' | 'view'>) { const { camera } = useThree(); const ref = useRef<Controls>(null); useEffect(() => { const c = ref.current; if (!c)
    return; const p = plots.find(p => p.id === selected), t = territories.find(t => t.id === region); const target = p ? [p.x, 1, p.z] : t ? [t.center[0], 0, t.center[1]] : [0, 0, 0]; const distance = p ? 7 : t ? 19 : 43; const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; c.enabled = false; const timeline = gsap.timeline({ onComplete: () => { c.enabled = true; } }); timeline.to(camera.position, { x: target[0] + distance * .55, y: distance * .9, z: target[2] + distance * .8, duration: reduced ? 0 : 1.6, ease: 'power3.inOut' }, 0).to(c.target, { x: target[0], y: target[1], z: target[2], duration: reduced ? 0 : 1.6, ease: 'power3.inOut', onUpdate: () => c.update() }, 0); return () => { timeline.kill(); c.enabled = true; }; }, [camera, region, selected, view]); return <MapControls ref={ref} makeDefault minDistance={4} maxDistance={85} maxPolarAngle={Math.PI / 2.6} minPolarAngle={.2} enableDamping dampingFactor={.08} onChange={() => { const c = ref.current; if (c) {
    c.target.x = THREE.MathUtils.clamp(c.target.x, -25, 25);
    c.target.z = THREE.MathUtils.clamp(c.target.z, -20, 20);
} }}/>; }
class Boundary extends Component<{
    children: ReactNode;
    onFail: () => void;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onFail(); }
    render() { return this.state.failed ? null : this.props.children; }
}
export default function World(props: Props) { return <Boundary onFail={props.onFail}><Canvas shadows dpr={[1, 1.5]} camera={{ position: [24, 39, 35], fov: 44, near: .1, far: 250 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', props.onFail, { once: true }); }}><color attach="background" args={['#0a171e']}/><fog attach="fog" args={['#0a171e', 65, 140]}/><ambientLight intensity={1.7}/><hemisphereLight args={['#ddffef', '#243d50', 1]}/><directionalLight position={[-20, 35, 15]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}/><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow><planeGeometry args={[250, 250]}/><meshStandardMaterial color="#102b35" roughness={.35} metalness={.6}/></mesh><gridHelper args={[180, 90, '#193d46', '#15343d']} position={[0, 0, 0]}/><Ground /><Landscape /><Parcels {...props}/>{territories.map(t => <Html key={t.id} position={[t.center[0], t.id === 'UMB' ? 4 : 2, t.center[1]]} center distanceFactor={50} zIndexRange={[10, 0]}><button className={'territory-label ' + (props.region === t.id ? 'chosen' : '')} onClick={() => props.onRegion(t.id)} style={{ '--territory': t.color } as React.CSSProperties}><i />{t.name}<span>{t.id === 'AUR' ? 'CAPITAL STATE' : t.id.startsWith('IS') ? 'OFFSHORE TERRITORY' : 'SOVEREIGN STATE'}</span></button></Html>)}<Camera {...props}/></Canvas></Boundary>; }
