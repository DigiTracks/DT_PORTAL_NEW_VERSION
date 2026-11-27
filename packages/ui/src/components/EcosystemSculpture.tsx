import { useEffect, useRef, useState } from "react";
import type { PublicProductRecord } from "@digitracks/catalog";
import type {
  BufferGeometry,
  CanvasTexture,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from "three";
import ProductMark from "./ProductMark";
import "../styles/sculpture.css";

type ThreeModule = typeof import("three");
type RoomEnvironmentConstructor = typeof import("three/addons/environments/RoomEnvironment.js").RoomEnvironment;
type SculptureState = "loading" | "ready" | "fallback";
type SculptureProduct = Pick<PublicProductRecord, "id" | "name" | "category" | "logo">;

interface ProductCard {
  group: Group;
  productIndex: number;
  homeY: number;
  angle: number;
  revealed: boolean;
  texture: CanvasTexture;
}

interface SculptureBuild {
  group: Group;
  cards: ProductCard[];
  geometries: Set<BufferGeometry>;
  materials: Set<Material>;
  textures: Set<Texture>;
  images: HTMLImageElement[];
  dispose: () => void;
}

const WARM_WHITE = "#fcfbf8";
const STEEL = "#9aa2ab";
const CYAN = "#5be7ff";
const BLUE = "#6d6bff";
const CORAL = "#ff7a59";
const YELLOW = "#ffc53d";
const GREEN = "#4fe3b0";
const ASSEMBLY_SECONDS = 1.15;
const TURN_SECONDS = 76;
const TURN_SPEED = Math.PI * 2 / TURN_SECONDS;
const CARD_WIDTH = 1.28;
const CARD_HEIGHT = 1.6;
const ORBIT_RADIUS = 3.65;
const TIER_HEIGHT = 1.82;
const BASE_ROTATION = { x: 0.075, y: -0.18, z: -0.025 } as const;
const FALLBACK_PRODUCT_IDS = ["mindone-pro", "vedik", "vertex", "orion", "vantor", "nipuna", "campus-grid"];

interface EcosystemSculptureProps {
  products: readonly SculptureProduct[];
  className?: string;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOut(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  let low = 0;
  let high = 1;
  let x = value;
  for (let iteration = 0; iteration < 14; iteration += 1) {
    const inverse = 1 - x;
    const curveX = 3 * inverse * inverse * x * 0.23 + 3 * inverse * x * x * 0.32 + x * x * x;
    if (curveX < value) low = x;
    else high = x;
    x = (low + high) / 2;
  }
  const inverse = 1 - x;
  return 3 * inverse * inverse * x + 3 * inverse * x * x + x * x * x;
}

function stepSpring(position: number, velocity: number, target: number, delta: number) {
  const displacement = position - target;
  const damping = 5;
  const frequency = Math.sqrt(75);
  const decay = Math.exp(-damping * delta);
  const cosine = Math.cos(frequency * delta);
  const sine = Math.sin(frequency * delta);
  return {
    position: target + decay * (displacement * cosine + ((velocity + damping * displacement) / frequency) * sine),
    velocity: decay * (velocity * cosine - ((damping * velocity + 100 * displacement) / frequency) * sine),
  };
}

function accentFor(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("education")) return YELLOW;
  if (normalized.includes("procure") || normalized.includes("supply")) return CORAL;
  if (normalized.includes("developer") || normalized.includes("cyber")) return CYAN;
  if (normalized.includes("health") || normalized.includes("beauty") || normalized.includes("hr")) return GREEN;
  return BLUE;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  let last = visible[maxLines - 1];
  while (context.measureText(`${last}…`).width > maxWidth && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  visible[maxLines - 1] = `${last}…`;
  return visible;
}

function drawPlaceholderMark(context: CanvasRenderingContext2D, product: SculptureProduct, x: number, y: number, size: number) {
  const initials = product.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
  context.save();
  context.fillStyle = "#f7f8f3";
  context.beginPath();
  context.roundRect(x, y, size, size, 18);
  context.fill();
  context.fillStyle = "#10202d";
  context.font = `700 ${Math.round(size * 0.34)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(initials, x + size / 2, y + size / 2 + 2);
  context.restore();
}

function drawCard(context: CanvasRenderingContext2D, product: SculptureProduct) {
  const accent = accentFor(product.category);
  const gradient = context.createLinearGradient(0, 0, 512, 640);
  gradient.addColorStop(0, "#183342");
  gradient.addColorStop(0.55, "#101f2c");
  gradient.addColorStop(1, "#09141e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 640);
  context.fillStyle = accent;
  context.fillRect(0, 0, 512, 12);
  context.strokeStyle = "rgba(252,251,248,0.2)";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, 509, 637);

  context.fillStyle = "rgba(252,251,248,0.52)";
  context.font = "500 20px Arial, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText("DIGI TRACKS / PRODUCT", 42, 58);
  context.fillStyle = accent;
  context.textAlign = "right";
  context.fillText(product.category.toUpperCase(), 470, 58);

  context.fillStyle = "rgba(252,251,248,0.04)";
  for (let x = 42; x < 512; x += 42) context.fillRect(x, 92, 1, 356);
  for (let y = 92; y < 448; y += 42) context.fillRect(42, y, 428, 1);

  context.fillStyle = "#f7f8f3";
  context.beginPath();
  context.roundRect(64, 92, 384, 384, 34);
  context.fill();
  context.strokeStyle = "rgba(16,32,45,0.16)";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = "rgba(252,251,248,0.35)";
  context.font = "500 18px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText("APPLICATION", 42, 518);
  context.fillStyle = WARM_WHITE;
  context.font = "600 40px Arial, sans-serif";
  const lines = wrapText(context, product.name, 428, 2);
  lines.forEach((line, index) => context.fillText(line, 42, 566 + index * 42));
  context.fillStyle = accent;
  context.fillRect(42, 624, 74, 4);
  context.fillStyle = "rgba(252,251,248,0.32)";
  context.fillRect(126, 610, 344, 1);
}

function drawCardBack(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, 512, 640);
  gradient.addColorStop(0, "#182742");
  gradient.addColorStop(1, "#0b1526");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 640);
  context.strokeStyle = "rgba(243,207,101,0.26)";
  context.lineWidth = 2;
  context.strokeRect(20, 20, 472, 600);
  context.fillStyle = "rgba(243,207,101,0.5)";
  context.font = "italic 700 142px Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("DT", 256, 286);
  context.fillStyle = "rgba(247,248,243,0.34)";
  context.font = "600 21px Arial, sans-serif";
  context.fillText("DIGI TRACKS", 256, 400);
  context.fillStyle = "rgba(247,248,243,0.16)";
  context.fillRect(196, 434, 120, 1);
  context.fillStyle = "rgba(247,248,243,0.26)";
  context.font = "500 17px Arial, sans-serif";
  context.fillText("PRODUCT LEDGER", 256, 486);
}

function createSculpture(THREE: ThreeModule, products: readonly SculptureProduct[]): SculptureBuild {
  const {
    AdditiveBlending,
    BoxGeometry,
    BufferGeometry,
    CanvasTexture,
    CylinderGeometry,
    DoubleSide,
    Group,
    LinearFilter,
    LinearMipmapLinearFilter,
    Line,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    SRGBColorSpace,
    Sprite,
    SpriteMaterial,
    TorusGeometry,
    Vector3,
  } = THREE;
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const images: HTMLImageElement[] = [];
  let isDisposed = false;
  const ownGeometry = <T extends BufferGeometry>(geometry: T) => {
    geometries.add(geometry);
    return geometry;
  };
  const ownMaterial = <T extends Material>(material: T) => {
    materials.add(material);
    return material;
  };

  const group = new Group();
  const cards: ProductCard[] = [];

  const darkMetal = ownMaterial(new MeshPhysicalMaterial({
    color: "#132630",
    metalness: 0.88,
    roughness: 0.26,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    flatShading: true,
  }));
  const midMetal = ownMaterial(new MeshPhysicalMaterial({
    color: "#3c5562",
    metalness: 0.82,
    roughness: 0.24,
    clearcoat: 0.4,
  }));
  const cardGeometry = ownGeometry(new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT));
  const frameGeometry = ownGeometry(new BoxGeometry(CARD_WIDTH + 0.11, CARD_HEIGHT + 0.11, 0.075));

  const backCanvas = document.createElement("canvas");
  backCanvas.width = 512;
  backCanvas.height = 640;
  const backContext = backCanvas.getContext("2d");
  if (backContext) drawCardBack(backContext);
  const backTexture = new CanvasTexture(backCanvas);
  backTexture.colorSpace = SRGBColorSpace;
  backTexture.minFilter = LinearMipmapLinearFilter;
  backTexture.generateMipmaps = true;
  textures.add(backTexture);
  const backMaterial = ownMaterial(new MeshBasicMaterial({ map: backTexture, toneMapped: false }));

  const tierCount = 3;
  const ringProducts = products.filter((product) => Boolean(product.logo));
  ringProducts.forEach((product, productIndex) => {
    const tier = productIndex % tierCount;
    const slot = Math.floor(productIndex / tierCount);
    const tierProducts = ringProducts.filter((_, index) => index % tierCount === tier);
    const angle = (slot / tierProducts.length) * Math.PI * 2 + tier * 0.19;
    const homeY = (tier - 1) * TIER_HEIGHT;
    const cardGroup = new Group();
    cardGroup.position.set(Math.sin(angle) * ORBIT_RADIUS, homeY, Math.cos(angle) * ORBIT_RADIUS);
    cardGroup.rotation.y = angle;

    const frame = new Mesh(frameGeometry, tier === 1 ? midMetal : darkMetal);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    if (!context) return;
    drawCard(context, product);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    textures.add(texture);
    const cardMaterial = ownMaterial(new MeshBasicMaterial({
      map: texture,
      transparent: false,
      toneMapped: false,
    }));
    const face = new Mesh(cardGeometry, cardMaterial);
    face.position.z = 0.044;
    const reverse = new Mesh(cardGeometry, backMaterial);
    reverse.rotation.y = Math.PI;
    reverse.position.z = -0.044;
    cardGroup.add(frame, face, reverse);

    if (product.logo) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (isDisposed) return;
        drawCard(context, product);
        const size = 332;
        context.save();
        context.beginPath();
        context.roundRect(90, 118, size, size, 26);
        context.clip();
        context.drawImage(image, 90, 118, size, size);
        context.restore();
        texture.needsUpdate = true;
      };
      image.src = product.logo;
      images.push(image);
    } else {
      drawPlaceholderMark(context, product, 90, 118, 332);
      texture.needsUpdate = true;
    }

    group.add(cardGroup);
    cards.push({ group: cardGroup, productIndex, homeY, angle, revealed: false, texture });
  });

  // Luminous orbit rings and a soft halo give the sculpture depth against the dark hero.
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = 256;
  haloCanvas.height = 256;
  const haloContext = haloCanvas.getContext("2d");
  if (haloContext) {
    const gradient = haloContext.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(91,231,255,0.5)");
    gradient.addColorStop(0.42, "rgba(143,123,255,0.16)");
    gradient.addColorStop(1, "rgba(143,123,255,0)");
    haloContext.fillStyle = gradient;
    haloContext.fillRect(0, 0, 256, 256);
  }
  const haloTexture = new CanvasTexture(haloCanvas);
  textures.add(haloTexture);
  const halo = new Sprite(ownMaterial(new SpriteMaterial({
    map: haloTexture,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })));
  halo.scale.set(11, 11, 1);
  group.add(halo);

  const ringGeometry = ownGeometry(new TorusGeometry(ORBIT_RADIUS, 0.012, 6, 256));
  const ringMaterials = [CYAN, BLUE, CYAN].map((color) => ownMaterial(new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.38,
    blending: AdditiveBlending,
    depthWrite: false,
  })));
  for (let tier = 0; tier < tierCount; tier += 1) {
    const ring = new Mesh(ringGeometry, ringMaterials[tier]);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = (tier - 1) * TIER_HEIGHT;
    group.add(ring);
  }

  return {
    group,
    cards,
    geometries,
    materials,
    textures,
    images,
    dispose: () => {
      isDisposed = true;
      for (const image of images) {
        image.onload = null;
        image.src = "";
      }
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}

function applyAssembly(build: SculptureBuild, elapsed: number) {
  build.cards.forEach((card, index) => {
    const local = clamp((elapsed - 0.06 - index * 0.012) / 0.72);
    const progress = easeOut(local);
    card.revealed = local > 0;
    card.group.visible = card.revealed;
    card.group.position.y = card.homeY - (1 - progress) * 0.52;
    card.group.scale.setScalar(0.84 + progress * 0.16);
  });
}

function SculptureFallback({ products }: { products: readonly SculptureProduct[] }) {
  const fallbackProducts = FALLBACK_PRODUCT_IDS
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is SculptureProduct => Boolean(product));
  return (
    <div className="ecosystem-sculpture__fallback" aria-hidden="true">
      {fallbackProducts.map((product, index) => (
        <div className={`ecosystem-sculpture__fallback-card ecosystem-sculpture__fallback-card--${index + 1}`} key={product.id}>
          <ProductMark product={product} size={82} />
          <span>{product.name}</span>
          <small>{product.category}</small>
        </div>
      ))}
    </div>
  );
}

export default function EcosystemSculpture({ products, className }: EcosystemSculptureProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SculptureState>("loading");

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    let renderer: WebGLRenderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let build: SculptureBuild | null = null;
    let environmentTarget: WebGLCubeRenderTarget | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let frameId = 0;
    let previousTime = 0;
    let lastDrawTime = 0;
    let elapsed = 0;
    let assemblyStartedAt: number | null = null;
    let turntableAngle = 0;
    let intersecting = false;
    let pageVisible = document.visibilityState !== "hidden";
    let canvasVisible = false;
    let disposed = false;
    let failed = false;
    let reportedReady = false;
    let finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let assembled = reducedMotion;
    let pointerX = 0;
    let pointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetX = 0;
    let targetY = 0;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let runtimeThree: ThreeModule | null = null;
    let runtimeRoomEnvironment: RoomEnvironmentConstructor | null = null;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (motionQuery.matches || !pointerQuery.matches) return;

    const canRender = () => !disposed && !failed && pageVisible && intersecting && canvasVisible;

    const stopFrame = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
      lastDrawTime = 0;
    };

    const ensureEnvironment = (THREE: ThreeModule, RoomEnvironment: RoomEnvironmentConstructor) => {
      if (!renderer || !scene || environmentTarget) return;
      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      try {
        environmentTarget = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
        scene.environment = environmentTarget.texture;
        scene.environmentIntensity = 0.9;
      } finally {
        room.dispose();
        generator.dispose();
      }
    };

    const renderFrame = (now: number, THREE: ThreeModule, RoomEnvironment: RoomEnvironmentConstructor) => {
      frameId = 0;
      if (!canRender() || !renderer || !build || !scene || !camera) return;
      if (now - lastDrawTime < 1000 / 30) {
        frameId = requestAnimationFrame((time) => renderFrame(time, THREE, RoomEnvironment));
        return;
      }
      lastDrawTime = now;
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.25) : 0;
      previousTime = now;
      let continuing = false;

      try {
        ensureEnvironment(THREE, RoomEnvironment);
        if (!reducedMotion && !assembled) {
          if (assemblyStartedAt === null) assemblyStartedAt = now;
          elapsed = Math.min(ASSEMBLY_SECONDS, (now - assemblyStartedAt) / 1000);
          applyAssembly(build, elapsed);
          continuing = elapsed < ASSEMBLY_SECONDS;
          if (!continuing) assembled = true;
        }

        if (assembled && !reducedMotion) {
          turntableAngle = (turntableAngle + delta * TURN_SPEED) % (Math.PI * 2);
          continuing = true;
          const springX = stepSpring(pointerX, velocityX, targetX, delta);
          const springY = stepSpring(pointerY, velocityY, targetY, delta);
          pointerX = springX.position;
          pointerY = springY.position;
          velocityX = springX.velocity;
          velocityY = springY.velocity;
        }

        build.group.rotation.set(BASE_ROTATION.x + pointerX, BASE_ROTATION.y + turntableAngle + pointerY, BASE_ROTATION.z);
        const spin = build.group.rotation.y;
        build.cards.forEach((card) => {
          card.group.visible = card.revealed;
        });
        renderer.render(scene, camera);
        if (!reportedReady) {
          reportedReady = true;
          setState("ready");
        }
      } catch {
        failed = true;
        dispose();
        setState("fallback");
        return;
      }

      if (continuing) frameId = requestAnimationFrame((time) => renderFrame(time, THREE, RoomEnvironment));
    };

    const requestFrame = (THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      if (frameId || !canRender() || !THREE || !RoomEnvironment) return;
      previousTime = performance.now();
      lastDrawTime = 0;
      frameId = requestAnimationFrame((time) => renderFrame(time, THREE, RoomEnvironment));
    };

    const resize = (THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      if (disposed || !renderer || !canvas || !camera) return;
      const bounds = root.getBoundingClientRect();
      const canvasBounds = canvas.getBoundingClientRect();
      const style = getComputedStyle(canvas);
      canvasVisible = bounds.width >= 1
        && bounds.height >= 1
        && canvasBounds.width >= 1
        && canvasBounds.height >= 1
        && style.display !== "none"
        && style.visibility !== "hidden"
        && style.opacity !== "0";

      if (!canvasVisible) {
        stopFrame();
        reportedReady = false;
        return;
      }

      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2, Math.sqrt(2_000_000 / (width * height)));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const vFov = (camera.fov * Math.PI) / 180;
      const halfFov = Math.tan(vFov / 2);
      const fitHeight = (TIER_HEIGHT + CARD_HEIGHT / 2 + 0.95) / halfFov;
      // Cards on the near side of the ring sit closer to the camera and project wider
      // than their 2D radius, so allow for the ring depth when fitting the frame.
      const fitWidth = ORBIT_RADIUS * 0.5 + (ORBIT_RADIUS + CARD_WIDTH / 2 + 0.95) / (halfFov * camera.aspect);
      camera.position.z = Math.max(10.2, fitHeight, fitWidth) * 1.03;
      camera.updateProjectionMatrix();
      requestFrame(THREE, RoomEnvironment);
    };

    const onPointerMove = (event: PointerEvent, THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      if (!finePointer || reducedMotion || !assembled) return;
      const bounds = root.getBoundingClientRect();
      targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.16;
      targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.1;
      requestFrame(THREE, RoomEnvironment);
    };

    const onPointerLeave = (THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      targetX = 0;
      targetY = 0;
      requestFrame(THREE, RoomEnvironment);
    };

    const onVisibilityChange = (THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      pageVisible = document.visibilityState !== "hidden";
      if (pageVisible) requestFrame(THREE, RoomEnvironment);
      else stopFrame();
    };

    const onMotionChange = (event: MediaQueryListEvent, THREE?: ThreeModule, RoomEnvironment?: RoomEnvironmentConstructor) => {
      reducedMotion = event.matches;
      if (reducedMotion && build) {
        assembled = true;
        turntableAngle = 0;
        pointerX = 0;
        pointerY = 0;
        targetX = 0;
        targetY = 0;
        velocityX = 0;
        velocityY = 0;
        applyAssembly(build, ASSEMBLY_SECONDS);
      }
      requestFrame(THREE, RoomEnvironment);
    };

    const onPointerCapabilityChange = (event: MediaQueryListEvent) => {
      finePointer = event.matches;
      pointerX = 0;
      pointerY = 0;
      targetX = 0;
      targetY = 0;
      velocityX = 0;
      velocityY = 0;
      if (!finePointer) {
        stopFrame();
        setState("fallback");
      } else {
        requestFrame(runtimeThree ?? undefined, runtimeRoomEnvironment ?? undefined);
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      dispose();
      setState("fallback");
    };

    const handlePointerMove = (event: PointerEvent) => onPointerMove(event, runtimeThree ?? undefined, runtimeRoomEnvironment ?? undefined);
    const handlePointerLeave = () => onPointerLeave(runtimeThree ?? undefined, runtimeRoomEnvironment ?? undefined);
    const handleVisibilityChange = () => onVisibilityChange(runtimeThree ?? undefined, runtimeRoomEnvironment ?? undefined);
    const handleMotionChange = (event: MediaQueryListEvent) => onMotionChange(event, runtimeThree ?? undefined, runtimeRoomEnvironment ?? undefined);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stopFrame();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
      pointerQuery.removeEventListener("change", onPointerCapabilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      canvas?.removeEventListener("webglcontextlost", onContextLost);
      canvas?.remove();
      runtimeThree = null;
      runtimeRoomEnvironment = null;
      build?.dispose();
      if (scene) scene.environment = null;
      environmentTarget?.dispose();
      if (renderer) {
        renderer.renderLists.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };

    const initialize = async () => {
      const [THREE, roomEnvironmentModule] = await Promise.all([
        import("three"),
        import("three/addons/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;
      const RoomEnvironment = roomEnvironmentModule.RoomEnvironment;
      runtimeThree = THREE;
      runtimeRoomEnvironment = RoomEnvironment;
      finePointer = pointerQuery.matches;
      reducedMotion = motionQuery.matches;
      assembled = reducedMotion;
      pageVisible = document.visibilityState !== "hidden";

      const {
        ACESFilmicToneMapping,
        DirectionalLight,
        HemisphereLight,
        PerspectiveCamera,
        PointLight,
        Scene,
        SRGBColorSpace,
        WebGLRenderer,
      } = THREE;
      scene = new Scene();
      camera = new PerspectiveCamera(38, 1, 0.1, 50);
      camera.position.set(0, 0.08, 10.2);
      camera.lookAt(0, 0, 0);

      try {
        renderer = new WebGLRenderer({
          antialias: true,
          alpha: true,
          stencil: false,
          powerPreference: "low-power",
        });
        canvas = renderer.domElement;
        canvas.className = "ecosystem-sculpture__canvas";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.removeProperty("display");
        canvas.addEventListener("webglcontextlost", onContextLost);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        stage.appendChild(canvas);

        build = createSculpture(THREE, products);
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        build.textures.forEach((texture) => {
          texture.anisotropy = maxAnisotropy;
          texture.needsUpdate = true;
        });
        scene.add(build.group);
        scene.add(new HemisphereLight(WARM_WHITE, "#06101b", 1.55));
        const keyLight = new DirectionalLight(WARM_WHITE, 2.8);
        keyLight.position.set(3, 5, 6);
        const rimLight = new DirectionalLight(CYAN, 2.2);
        rimLight.position.set(-4, 1, -3);
        const fillLight = new DirectionalLight(BLUE, 1.2);
        fillLight.position.set(4, -1, 2);
        const warmLight = new PointLight(CORAL, 4, 10, 2);
        warmLight.position.set(-2, -2, 4);
        scene.add(keyLight, rimLight, fillLight, warmLight);

        applyAssembly(build, reducedMotion ? ASSEMBLY_SECONDS : 0);
        build.group.rotation.set(BASE_ROTATION.x, BASE_ROTATION.y, BASE_ROTATION.z);
        const initialBuild = build;
        initialBuild.cards.forEach((card) => {
          card.group.visible = true;
        });

        root.addEventListener("pointermove", handlePointerMove);
        root.addEventListener("pointerleave", handlePointerLeave);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        motionQuery.addEventListener("change", handleMotionChange);
        pointerQuery.addEventListener("change", onPointerCapabilityChange);

        resizeObserver = new ResizeObserver(() => resize(THREE, RoomEnvironment));
        resizeObserver.observe(root);
        resizeObserver.observe(canvas);
        if (typeof IntersectionObserver !== "undefined") {
          intersectionObserver = new IntersectionObserver((entries) => {
            intersecting = entries.some((entry) => entry.isIntersecting);
            if (intersecting) requestFrame(THREE, RoomEnvironment);
            else stopFrame();
          });
          intersectionObserver.observe(root);
        } else {
          intersecting = true;
        }
        resize(THREE, RoomEnvironment);
      } catch {
        failed = true;
        dispose();
        setState("fallback");
      }
    };

    void initialize().catch(() => {
      if (disposed) return;
      failed = true;
      dispose();
      setState("fallback");
    });

    return dispose;
  }, [products]);

  return (
    <div
      ref={rootRef}
      className={["ecosystem-sculpture", className].filter(Boolean).join(" ")}
      data-sculpture="product-orbit"
      data-state={state}
      data-product-count={products.length}
      aria-hidden="true"
    >
      <SculptureFallback products={products} />
      <div ref={stageRef} className="ecosystem-sculpture__stage" aria-hidden="true" />
    </div>
  );
}
