import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import * as THREE from 'three';

interface Container3DProps {
  fillPercentage: number;
  containerType: string;
  currentVolume: number;
  maxVolume: number;
  currentWeight: number;
  maxWeight: number;
  containerNumber?: number;
}

function ContainerMesh({ fillPercentage, containerType, containerNumber = 1 }: { 
  fillPercentage: number; 
  containerType: string;
  containerNumber?: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Calcular dimensões baseadas no tipo de contêiner
  const getContainerDimensions = () => {
    switch (containerType) {
      case '20_feet':
        return { width: 4, height: 2.5, depth: 2 };
      case '40_feet':
        return { width: 8, height: 2.5, depth: 2 };
      case '40_hc':
        return { width: 8, height: 3, depth: 2 };
      default:
        return { width: 4, height: 2.5, depth: 2 };
    }
  };

  const { width, height, depth } = getContainerDimensions();
  const fillHeight = (height - 0.2) * (fillPercentage / 100);
  
  // Criar seções de preenchimento (como pallets)
  const createFillSections = () => {
    const sections = [];
    const sectionsPerRow = 4;
    const sectionsPerColumn = 2;
    const sectionWidth = (width - 0.4) / sectionsPerRow;
    const sectionDepth = (depth - 0.4) / sectionsPerColumn;
    const maxSections = sectionsPerRow * sectionsPerColumn;
    const filledSections = Math.floor((fillPercentage / 100) * maxSections);
    
    for (let i = 0; i < sectionsPerRow; i++) {
      for (let j = 0; j < sectionsPerColumn; j++) {
        const index = i * sectionsPerColumn + j;
        const isFilled = index < filledSections;
        
        if (isFilled) {
          const x = (i - sectionsPerRow / 2 + 0.5) * sectionWidth;
          const z = (j - sectionsPerColumn / 2 + 0.5) * sectionDepth;
          
          sections.push(
            <Box
              key={`section-${i}-${j}`}
              position={[x, -height/2 + 0.3, z]}
              args={[sectionWidth - 0.1, 0.4, sectionDepth - 0.1]}
            >
              <meshStandardMaterial 
                color={fillPercentage > 80 ? "#ff6b6b" : fillPercentage > 60 ? "#ffd93d" : "#6bcf7f"} 
                roughness={0.3}
                metalness={0.1}
              />
            </Box>
          );
        }
      }
    }
    
    return sections;
  };

  return (
    <group ref={meshRef}>
      {/* Estrutura do contêiner */}
      <group>
        {/* Paredes do contêiner */}
        <Box position={[0, 0, 0]} args={[width, height, depth]}>
          <meshStandardMaterial 
            color="#e0e0e0" 
            transparent 
            opacity={0.3}
            roughness={0.7}
            metalness={0.3}
          />
        </Box>
        
        {/* Bordas do contêiner */}
        {/* Bordas horizontais */}
        {[-height/2, height/2].map((y, i) => (
          <group key={`horizontal-edges-${i}`}>
            <Box position={[0, y, depth/2]} args={[width, 0.05, 0.05]}>
              <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </Box>
            <Box position={[0, y, -depth/2]} args={[width, 0.05, 0.05]}>
              <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </Box>
            <Box position={[width/2, y, 0]} args={[0.05, 0.05, depth]}>
              <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </Box>
            <Box position={[-width/2, y, 0]} args={[0.05, 0.05, depth]}>
              <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </Box>
          </group>
        ))}
        
        {/* Bordas verticais */}
        {[
          [width/2, depth/2], [width/2, -depth/2], 
          [-width/2, depth/2], [-width/2, -depth/2]
        ].map(([x, z], i) => (
          <Box key={`vertical-edge-${i}`} position={[x, 0, z]} args={[0.05, height, 0.05]}>
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </Box>
        ))}
        
        {/* Base do contêiner */}
        <Box position={[0, -height/2, 0]} args={[width, 0.1, depth]}>
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.5} />
        </Box>
      </group>
      
      {/* Conteúdo (seções preenchidas) */}
      <group ref={fillRef}>
        {createFillSections()}
      </group>
      
      {/* Texto do contêiner */}
      <Text
        position={[0, height/2 + 0.5, 0]}
        fontSize={0.3}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        {containerType.replace('_', ' ').toUpperCase()} - Container #{containerNumber}
      </Text>
      
      {/* Indicador de preenchimento */}
      <Text
        position={[0, -height/2 - 0.5, 0]}
        fontSize={0.25}
        color={fillPercentage > 80 ? "#ff6b6b" : fillPercentage > 60 ? "#ffd93d" : "#6bcf7f"}
        anchorX="center"
        anchorY="middle"
      >
        {fillPercentage.toFixed(1)}% preenchido
      </Text>
    </group>
  );
}

export function Container3D({ 
  fillPercentage, 
  containerType, 
  currentVolume, 
  maxVolume, 
  currentWeight, 
  maxWeight,
  containerNumber = 1 
}: Container3DProps) {
  return (
    <div className="w-full h-96 bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg overflow-hidden">
      <Canvas
        camera={{ 
          position: [8, 4, 8], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        {/* Iluminação */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* Contêiner 3D */}
        <ContainerMesh 
          fillPercentage={fillPercentage} 
          containerType={containerType}
          containerNumber={containerNumber}
        />
        
        {/* Controles de câmera */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Chão */}
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
        </mesh>
      </Canvas>
      
      {/* Informações overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-semibold">Volume</div>
            <div>{currentVolume.toFixed(2)}m³ / {maxVolume}m³</div>
          </div>
          <div>
            <div className="font-semibold">Peso</div>
            <div>{currentWeight.toFixed(2)}kg / {maxWeight}kg</div>
          </div>
        </div>
      </div>
    </div>
  );
}