import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Chrome de Active Theory: violeta apagado para la estructura wireframe.
const VIOLET = new THREE.Color("#343755");
const WHITE = new THREE.Color("#ffffff");

// El portal en sí (el emblema) lleva el degradado propio de AUREN AI —
// del mark real: rojo/magenta → iris eléctrico → cian.
const BRAND_RED = new THREE.Color("#ff3b6b");
const BRAND_IRIS = new THREE.Color("#8052ff");
const BRAND_CYAN = new THREE.Color("#4aa8ff");
const BRAND_GOLD = new THREE.Color("#ffb829");
const BRAND_PALETTE = [BRAND_RED, BRAND_IRIS, BRAND_IRIS, BRAND_CYAN, BRAND_GOLD];

type ProgressRef = { current: number };

/** Textura radial cian→magenta generada en canvas — el aro de brillo del portal. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Degradado radial que replica el mark de AUREN: iris → cian en el núcleo,
    // rojo/magenta disolviéndose hacia el borde — el emblema es el único acento
    // cromático fuerte de la página, tal como pide el modelo de Active Theory.
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(128,82,255,0.55)");
    grad.addColorStop(0.32, "rgba(74,168,255,0.34)");
    grad.addColorStop(0.65, "rgba(255,59,107,0.18)");
    grad.addColorStop(1, "rgba(255,59,107,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/** Nube de partículas verde/oro distribuida en dos capas esféricas. */
function useParticleField(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const shell = Math.random() < 0.72 ? 1 : 1.85; // núcleo denso + halo disperso
      const radius = (0.55 + Math.random() * 0.5) * shell;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = BRAND_PALETTE[(Math.random() * BRAND_PALETTE.length) | 0];
      const mixed = c.clone().lerp(WHITE, Math.random() * 0.25);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, [count]);
}

function PortalGroup({ progressRef }: { progressRef: ProgressRef }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerWireRef = useRef<THREE.LineSegments>(null);
  const outerWireRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const glowTexture = useGlowTexture();
  const particleCount = useMemo(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? 1100 : 2400),
    [],
  );
  const { positions, colors } = useParticleField(particleCount);

  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useFrame(({ clock, pointer: p }, delta) => {
    const t = clock.getElapsedTime();
    const progress = progressRef.current;

    pointer.current.tx = p.x;
    pointer.current.ty = p.y;
    pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.04;
    pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.04;

    if (groupRef.current) {
      const idle = reduceMotion ? 0 : delta * 0.045;
      groupRef.current.rotation.y += idle + progress * 0.012;
      groupRef.current.rotation.x = pointer.current.y * 0.18 - progress * 0.05;
      groupRef.current.rotation.z = pointer.current.x * -0.06;

      // La formación "coalesce": el portal crece y se asienta a medida que se narra la historia.
      const scale = 0.86 + progress * 0.3;
      groupRef.current.scale.setScalar(scale);
    }

    if (innerWireRef.current) {
      const m = innerWireRef.current.material as THREE.LineBasicMaterial;
      m.opacity = 0.28 + progress * 0.4 + (reduceMotion ? 0 : Math.sin(t * 0.6) * 0.03);
    }
    if (outerWireRef.current) {
      outerWireRef.current.rotation.y -= reduceMotion ? 0 : delta * 0.03;
      outerWireRef.current.rotation.x += reduceMotion ? 0 : delta * 0.015;
      const m = outerWireRef.current.material as THREE.LineBasicMaterial;
      m.opacity = 0.16 + progress * 0.22;
    }
    if (glowRef.current) {
      const s = 3.1 + Math.sin(t * 0.4) * 0.12 + progress * 0.9;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.SpriteMaterial).opacity = 0.55 + progress * 0.35;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += reduceMotion ? 0 : delta * 0.02;
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.35 + progress * 0.5;
      mat.size = (0.02 + progress * 0.012) * (window.innerWidth < 768 ? 0.8 : 1);
    }
  });

  return (
    <group ref={groupRef}>
      <sprite ref={glowRef} position={[0, 0, -0.2]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.55}
        />
      </sprite>

      <lineSegments ref={innerWireRef}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1.55, 2)]} />
        <lineBasicMaterial color={WHITE} transparent opacity={0.3} />
      </lineSegments>

      <lineSegments ref={outerWireRef} rotation={[0.4, 0.2, 0.1]}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1.9, 1)]} />
        <lineBasicMaterial color={VIOLET} transparent opacity={0.2} />
      </lineSegments>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function CameraRig({ progressRef }: { progressRef: ProgressRef }) {
  const { camera } = useThree();
  useFrame(() => {
    const progress = progressRef.current;
    camera.position.z = THREE.MathUtils.lerp(5.4, 3.6, progress);
    camera.position.y = THREE.MathUtils.lerp(0.15, -0.1, progress);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function PortalScene({
  progressRef,
  className = "",
}: {
  progressRef: ProgressRef;
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 42, position: [0, 0.15, 5.4], near: 0.1, far: 20 }}
      aria-hidden="true"
    >
      <CameraRig progressRef={progressRef} />
      <PortalGroup progressRef={progressRef} />
    </Canvas>
  );
}
