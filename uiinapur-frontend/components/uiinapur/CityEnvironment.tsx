'use client';
/* eslint-disable react-hooks/immutability -- Attach/dispose imperative Three.js objects and collision metadata only inside the scene effect. */
import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { buildCity, terrainSampler } from '@/lib/uiinapur/cityGeometry';

export default function CityEnvironment({ terrain, environment }: { terrain:RefObject<THREE.Group|null>;environment:RefObject<THREE.Group|null> }) {
  const holder=useRef<THREE.Group>(null);
  useEffect(()=>{
    const host=holder.current,world=environment.current,land=terrain.current;
    if(!host||!world||!land)return;
    world.userData.cityReady=false;
    const city=buildCity(terrainSampler(land));
    host.add(city.group);host.updateWorldMatrix(true,true);
    world.userData.citySurface=city.surfaceAt;world.userData.cityReady=true;
    return()=>{world.userData.cityReady=false;delete world.userData.citySurface;host.remove(city.group);city.dispose();};
  },[terrain,environment]);
  return <group ref={holder}/>;
}
