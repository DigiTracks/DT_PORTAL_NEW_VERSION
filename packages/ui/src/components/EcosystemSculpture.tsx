import { useEffect, useId, useRef, useState } from "react";
import type {
  BufferGeometry,
  Curve,
  Group,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from "three";
import "../styles/sculpture.css";

interface EcosystemSculptureProps {
  className?: string;
}

type PointTuple = readonly [number, number, number];
type ThreeModule = typeof import("three");
type SculptureState = "ready" | "fallback";

interface FlowPath {
  start: PointTuple;
  first: PointTuple;
  second: PointTuple;
  end: PointTuple;
}

interface RibbonAssembly {
  body: Mesh<BufferGeometry, MeshStandardMaterial>;
  edge: Line<BufferGeometry, LineBasicMaterial>;
  highlight: Line<BufferGeometry, LineBasicMaterial>;
  filament: Line<BufferGeometry, LineBasicMaterial>;
  node: Group;
  clamp: Mesh<BufferGeometry, MeshStandardMaterial>;
  segments: number;
  indexCount: number;
  pointCount: number;
}

interface LayerAssembly {
  group: Group;
  home: Vector3;
  tilt: number;
}

interface SculptureBuild {
  group: Group;
  core: Group;
  base: Group;
  cap: Group;
  layers: LayerAssembly[];
  ribbons: RibbonAssembly[];
  coreEdgeMaterial: LineBasicMaterial;
  dispose: () => void;
}

const WARM_WHITE = "#fcfbf8";
const STEEL = "#9aa2ab";
const CYAN = "#6ce5e8";
const DEEP_BLUE = "#477bff";
const ASSEMBLY_SECONDS = 1.2;
const TURN_SECONDS = 72;
const TURN_SPEED = Math.PI * 2 / TURN_SECONDS;
const BASE_Y = -2.42;
const CAP_Y = 2.42;
const BASE_ROTATION = { x: 0.2, y: -0.46, z: -0.055 } as const;

const LAYER_SPECS = [
  { y: -1.7, width: 2.65, depth: 1.72, x: -0.1, z: 0.03, rotation: -0.05, pitch: 0.06, yaw: -0.12 },
  { y: -0.85, width: 3.35, depth: 1.95, x: 0.14, z: 0.08, rotation: 0.025, pitch: -0.08, yaw: 0.16 },
  { y: 0, width: 2.75, depth: 1.52, x: -0.12, z: -0.08, rotation: -0.025, pitch: 0.04, yaw: -0.2 },
  { y: 0.85, width: 3.6, depth: 1.85, x: 0.18, z: 0.05, rotation: 0.04, pitch: -0.06, yaw: 0.12 },
  { y: 1.7, width: 2.45, depth: 1.55, x: -0.08, z: -0.06, rotation: -0.055, pitch: 0.08, yaw: -0.08 },
] as const;

const FLOW_PATHS: readonly FlowPath[] = [
  { start: [-1.28, -2.24, 0.38], first: [-1.18, -1.2, 0.7], second: [-0.62, 1.18, 0.42], end: [-0.46, 2.18, 0.12] },
  { start: [-0.76, -2.2, -0.48], first: [-0.86, -1.08, -0.78], second: [-0.36, 1.02, -0.62], end: [-0.2, 2.3, -0.2] },
  { start: [0.02, -2.24, 0.18], first: [0.2, -1.22, 0.34], second: [0.04, 0.92, 0.2], end: [0.2, 2.28, 0.1] },
  { start: [0.82, -2.18, -0.36], first: [1.02, -0.98, -0.64], second: [0.46, 1.14, -0.42], end: [0.4, 2.2, -0.14] },
  { start: [1.34, -2.02, 0.48], first: [1.48, -0.84, 0.66], second: [0.84, 1.16, 0.4], end: [0.62, 2.12, 0.14] },
  { start: [-1.44, -1.62, -0.18], first: [-1.52, -0.68, -0.34], second: [-0.9, 1.2, -0.18], end: [-0.54, 2.16, -0.08] },
];

const FALLBACK_LAYERS = [
  { y: 232, width: 142, depth: 74, x: 386, tilt: -2 },
  { y: 326, width: 194, depth: 88, x: 414, tilt: 1 },
  { y: 420, width: 158, depth: 72, x: 382, tilt: -1 },
  { y: 514, width: 208, depth: 90, x: 418, tilt: 2 },
  { y: 608, width: 138, depth: 70, x: 390, tilt: -2 },
] as const;

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

function vector(THREE: ThreeModule, point: PointTuple) {
  return new THREE.Vector3(point[0], point[1], point[2]);
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

function createRibbonGeometry(THREE: ThreeModule, curve: Curve<Vector3>, width: number, thickness: number, segments: number) {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const edgePoints: Vector3[] = [];
  const highlightPoints: Vector3[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const point = curve.getPointAt(index / segments);
    const normal = frames.normals[index];
    const binormal = frames.binormals[index];
    const corners = [
      point.clone().addScaledVector(binormal, width / 2).addScaledVector(normal, thickness / 2),
      point.clone().addScaledVector(binormal, -width / 2).addScaledVector(normal, thickness / 2),
      point.clone().addScaledVector(binormal, -width / 2).addScaledVector(normal, -thickness / 2),
      point.clone().addScaledVector(binormal, width / 2).addScaledVector(normal, -thickness / 2),
    ];
    for (const corner of corners) positions.push(corner.x, corner.y, corner.z);
    edgePoints.push(point.clone().addScaledVector(normal, thickness * 0.58).addScaledVector(binormal, -width * 0.16));
    highlightPoints.push(point.clone().addScaledVector(normal, thickness * 0.58).addScaledVector(binormal, width * 0.48));
  }

  for (let index = 0; index < segments; index += 1) {
    for (let side = 0; side < 4; side += 1) {
      const nextSide = (side + 1) % 4;
      const a = index * 4 + side;
      const b = (index + 1) * 4 + side;
      const c = (index + 1) * 4 + nextSide;
      const d = index * 4 + nextSide;
      indices.push(a, b, d, b, c, d);
    }
  }

  indices.push(0, 2, 1, 0, 3, 2);
  const last = segments * 4;
  indices.push(last, last + 1, last + 2, last, last + 2, last + 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return { geometry, edgePoints, highlightPoints };
}

function createSculpture(THREE: ThreeModule): SculptureBuild {
  const {
    AdditiveBlending,
    BoxGeometry,
    BufferGeometry,
    CubicBezierCurve3,
    CylinderGeometry,
    DodecahedronGeometry,
    DoubleSide,
    EdgesGeometry,
    ExtrudeGeometry,
    Float32BufferAttribute,
    Group,
    Line,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    OctahedronGeometry,
    Shape,
    TorusGeometry,
    Vector3,
  } = THREE;
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const ownGeometry = <T extends BufferGeometry>(geometry: T) => {
    geometries.add(geometry);
    return geometry;
  };
  const ownMaterial = <T extends Material>(material: T) => {
    materials.add(material);
    return material;
  };

  const group = new Group();
  const core = new Group();
  const base = new Group();
  const cap = new Group();
  const layers: LayerAssembly[] = [];
  const ribbons: RibbonAssembly[] = [];
  group.add(base, core, cap);

  const darkMetal = ownMaterial(new MeshPhysicalMaterial({
    color: "#132630",
    metalness: 0.9,
    roughness: 0.28,
    clearcoat: 0.42,
    clearcoatRoughness: 0.2,
    flatShading: true,
    side: DoubleSide,
  }));
  const midMetal = ownMaterial(new MeshPhysicalMaterial({
    color: "#435863",
    metalness: 0.86,
    roughness: 0.24,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
    flatShading: true,
    side: DoubleSide,
  }));
  const steelMaterial = ownMaterial(new MeshPhysicalMaterial({
    color: STEEL,
    metalness: 0.82,
    roughness: 0.25,
    clearcoat: 0.25,
  }));
  const panelMaterial = ownMaterial(new MeshPhysicalMaterial({
    color: "#081720",
    metalness: 0.7,
    roughness: 0.32,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
    flatShading: true,
    side: DoubleSide,
  }));
  const ceramicMaterial = ownMaterial(new MeshStandardMaterial({
    color: "#c4cfcc",
    metalness: 0.38,
    roughness: 0.34,
  }));
  const seamMaterial = ownMaterial(new MeshStandardMaterial({
    color: CYAN,
    emissive: CYAN,
    emissiveIntensity: 1.4,
    metalness: 0.25,
    roughness: 0.3,
  }));
  const coreChannelMaterial = ownMaterial(new MeshStandardMaterial({
    color: "#4bc4c9",
    emissive: CYAN,
    emissiveIntensity: 0.48,
    metalness: 0.55,
    roughness: 0.32,
  }));
  const coreGlassMaterial = ownMaterial(new MeshPhysicalMaterial({
    color: "#77dfe3",
    metalness: 0.1,
    roughness: 0.16,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: DoubleSide,
  }));
  const coreEdgeMaterial = ownMaterial(new LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.52,
    toneMapped: false,
  }));
  const edgeMaterial = ownMaterial(new LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.8,
    toneMapped: false,
    blending: AdditiveBlending,
    depthWrite: false,
  }));
  const highlightMaterial = ownMaterial(new LineBasicMaterial({
    color: WARM_WHITE,
    transparent: true,
    opacity: 0.3,
    toneMapped: false,
    depthWrite: false,
  }));
  const filamentMaterial = ownMaterial(new LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.22,
    toneMapped: false,
    depthWrite: false,
  }));
  const traceMaterial = ownMaterial(new LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.34,
    toneMapped: false,
    depthWrite: false,
  }));
  const frameMaterial = ownMaterial(new LineBasicMaterial({
    color: STEEL,
    transparent: true,
    opacity: 0.2,
    toneMapped: false,
    depthWrite: false,
  }));
  const nodeMaterial = ownMaterial(new MeshStandardMaterial({
    color: CYAN,
    emissive: CYAN,
    emissiveIntensity: 1.15,
    metalness: 0.2,
    roughness: 0.24,
  }));
  const blueNodeMaterial = ownMaterial(new MeshStandardMaterial({
    color: DEEP_BLUE,
    emissive: DEEP_BLUE,
    emissiveIntensity: 0.75,
    metalness: 0.25,
    roughness: 0.3,
  }));
  const glowMaterial = ownMaterial(new MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.16,
    toneMapped: false,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  }));
  const spineMaterial = ownMaterial(new MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.88,
    toneMapped: false,
  }));

  const statusGeometry = ownGeometry(new BoxGeometry(0.095, 0.045, 0.035));
  const portGeometry = ownGeometry(new BoxGeometry(0.04, 0.085, 0.12));
  const insetGeometry = ownGeometry(new BoxGeometry(0.5, 0.024, 0.065));
  const ventGeometry = ownGeometry(new BoxGeometry(0.026, 0.022, 0.14));
  const boltGeometry = ownGeometry(new CylinderGeometry(0.024, 0.024, 0.024, 6));
  const labelGeometry = ownGeometry(new BoxGeometry(0.34, 0.052, 0.018));

  const plateGeometry = (width: number, depth: number, thickness: number, chamfer = 0.12) => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const shape = new Shape();
    shape.moveTo(-halfWidth + chamfer, -halfDepth);
    shape.lineTo(halfWidth - chamfer, -halfDepth);
    shape.lineTo(halfWidth, -halfDepth + chamfer);
    shape.lineTo(halfWidth, halfDepth - chamfer);
    shape.lineTo(halfWidth - chamfer, halfDepth);
    shape.lineTo(-halfWidth + chamfer, halfDepth);
    shape.lineTo(-halfWidth, halfDepth - chamfer);
    shape.lineTo(-halfWidth, -halfDepth + chamfer);
    shape.closePath();
    const geometry = ownGeometry(new ExtrudeGeometry(shape, {
      depth: thickness,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.024,
      bevelSegments: 1,
    }));
    geometry.center();
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  };

  const makePlate = (
    width: number,
    depth: number,
    thickness: number,
    position: PointTuple,
    rotation: number,
    bodyMaterial: MeshStandardMaterial,
    instrumented: boolean,
  ) => {
    const plate = new Group();
    const bodyGeometry = plateGeometry(width, depth, thickness);
    const body = new Mesh(bodyGeometry, bodyMaterial);
    const panel = new Mesh(plateGeometry(width - 0.28, depth - 0.26, 0.026, 0.09), panelMaterial);
    panel.position.y = thickness / 2 + 0.03;
    const seam = new Mesh(plateGeometry(width + 0.025, depth + 0.025, 0.024, 0.12), seamMaterial);
    seam.position.y = -thickness / 2 - 0.01;
    const edge = new LineSegments(ownGeometry(new EdgesGeometry(bodyGeometry, 24)), coreEdgeMaterial);
    plate.add(body, panel, seam, edge);

    const top = thickness / 2 + 0.054;
    [-1, 1].forEach((xDirection) => {
      [-1, 1].forEach((zDirection) => {
        const bolt = new Mesh(boltGeometry, steelMaterial);
        bolt.position.set(xDirection * (width / 2 - 0.15), top, zDirection * (depth / 2 - 0.14));
        plate.add(bolt);
      });
    });

    if (instrumented) {
      const inset = new Mesh(insetGeometry, ceramicMaterial);
      inset.scale.x = width / 2.65;
      inset.position.set(-width * 0.24, top, depth * 0.26);
      const label = new Mesh(labelGeometry, ceramicMaterial);
      label.position.set(width * 0.27, 0, depth / 2 + 0.026);
      plate.add(inset, label);

      for (let index = 0; index < 5; index += 1) {
        const vent = new Mesh(ventGeometry, darkMetal);
        vent.position.set(width * 0.08 + index * 0.048, top, depth * 0.27);
        plate.add(vent);
      }
      const tracePositions = [
        -width * 0.34, top, -depth * 0.26, width * 0.28, top, -depth * 0.26,
        width * 0.28, top, -depth * 0.26, width * 0.28, top, depth * 0.19,
        -width * 0.18, top, depth * 0.28, width * 0.08, top, depth * 0.28,
        width * 0.08, top, depth * 0.28, width * 0.08, top, -depth * 0.05,
        -width * 0.34, top, -depth * 0.05, -width * 0.18, top, -depth * 0.05,
      ];
      const traceGeometry = ownGeometry(new BufferGeometry());
      traceGeometry.setAttribute("position", new Float32BufferAttribute(tracePositions, 3));
      plate.add(new LineSegments(traceGeometry, traceMaterial));

      [-0.27, 0, 0.27].forEach((offset, index) => {
        const status = new Mesh(statusGeometry, index === 1 ? blueNodeMaterial : nodeMaterial);
        status.position.set(width * offset, 0, depth / 2 + 0.035);
        plate.add(status);
      });
      [-0.24, 0.24].forEach((offset) => {
        const port = new Mesh(portGeometry, steelMaterial);
        port.position.set(width / 2 + 0.025, 0, depth * offset);
        plate.add(port);
      });
    }

    plate.position.set(position[0], position[1], position[2]);
    plate.rotation.z = rotation;
    return plate;
  };

  LAYER_SPECS.forEach((spec, index) => {
    const layer = makePlate(
      spec.width,
      spec.depth,
      0.19,
      [spec.x, spec.y, spec.z],
      spec.rotation,
      index % 2 === 0 ? darkMetal : midMetal,
      true,
    );
    layer.rotation.x = spec.pitch;
    layer.rotation.y = spec.yaw;
    group.add(layer);
    layers.push({ group: layer, home: layer.position.clone(), tilt: spec.rotation });
  });

  const basePlate = makePlate(2.72, 1.94, 0.22, [0, BASE_Y, 0], 0, darkMetal, false);
  const capPlate = makePlate(1.72, 1.34, 0.18, [0, CAP_Y, 0], 0, midMetal, false);
  base.add(basePlate);
  cap.add(capPlate);

  const footGeometry = ownGeometry(new BoxGeometry(0.28, 0.18, 0.28));
  [-0.96, 0.96].forEach((x) => {
    [-0.58, 0.58].forEach((z) => {
      const foot = new Mesh(footGeometry, steelMaterial);
      foot.position.set(x, -0.18, z);
      base.add(foot);
    });
  });

  const coreGeometry = ownGeometry(new CylinderGeometry(0.43, 0.56, 3.66, 6, 1, false));
  const corePrism = new Mesh(coreGeometry, darkMetal);
  const coreEdges = new LineSegments(ownGeometry(new EdgesGeometry(coreGeometry, 20)), coreEdgeMaterial);
  const coreChannel = new Mesh(ownGeometry(new CylinderGeometry(0.19, 0.25, 3.38, 6, 1, false)), coreChannelMaterial);
  const coreGlass = new Mesh(ownGeometry(new CylinderGeometry(0.49, 0.61, 3.5, 6, 1, true)), coreGlassMaterial);
  const coreGlow = new Mesh(ownGeometry(new CylinderGeometry(0.48, 0.6, 3.5, 6, 1, true)), glowMaterial);
  const spine = new Mesh(ownGeometry(new BoxGeometry(0.085, 2.92, 0.035)), spineMaterial);
  spine.position.set(0, 0, 0.53);
  core.add(corePrism, coreChannel, coreGlass, coreEdges, coreGlow, spine);

  const coreRingGeometry = ownGeometry(new TorusGeometry(0.5, 0.016, 4, 6));
  [-1.55, -0.78, 0, 0.78, 1.55].forEach((y, index) => {
    const ring = new Mesh(coreRingGeometry, index === 2 ? nodeMaterial : steelMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI / 6;
    ring.position.y = y;
    core.add(ring);
  });

  const coreRodGeometry = ownGeometry(new CylinderGeometry(0.014, 0.014, 3.2, 5));
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const rod = new Mesh(coreRodGeometry, index % 2 === 0 ? coreChannelMaterial : steelMaterial);
    rod.position.set(Math.cos(angle) * 0.47, 0, Math.sin(angle) * 0.47);
    core.add(rod);
  }

  const railGeometry = ownGeometry(new BoxGeometry(0.044, 4.02, 0.044));
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + (index / 6) * Math.PI * 2;
    const rail = new Mesh(railGeometry, index % 2 === 0 ? steelMaterial : nodeMaterial);
    rail.position.set(Math.cos(angle) * 0.68, 0, Math.sin(angle) * 0.68);
    core.add(rail);
  }

  const crossbarGeometry = ownGeometry(new BoxGeometry(1.22, 0.026, 0.026));
  [-1.55, -0.78, 0, 0.78, 1.55].forEach((y, index) => {
    const crossbar = new Mesh(crossbarGeometry, index === 2 ? nodeMaterial : steelMaterial);
    crossbar.position.y = y;
    crossbar.rotation.y = index % 2 === 0 ? 0.12 : -0.12;
    core.add(crossbar);
  });

  const capNode = new Mesh(ownGeometry(new OctahedronGeometry(0.17, 0)), nodeMaterial);
  capNode.position.y = 0.25;
  cap.add(capNode);
  [-0.48, 0.48].forEach((x) => {
    const capPort = new Mesh(ownGeometry(new CylinderGeometry(0.045, 0.06, 0.16, 6)), steelMaterial);
    capPort.position.set(x, 0.15, 0.22);
    cap.add(capPort);
  });
  const baseNode = new Mesh(ownGeometry(new DodecahedronGeometry(0.14, 0)), blueNodeMaterial);
  baseNode.position.y = 0.2;
  base.add(baseNode);
  const baseSeam = new Mesh(ownGeometry(new TorusGeometry(0.78, 0.018, 4, 6)), seamMaterial);
  baseSeam.rotation.x = Math.PI / 2;
  baseSeam.position.y = 0.14;
  base.add(baseSeam);

  const nodeGeometry = ownGeometry(new OctahedronGeometry(0.085, 0));
  const clampGeometry = ownGeometry(new BoxGeometry(0.12, 0.07, 0.07));

  FLOW_PATHS.forEach((path, index) => {
    const curve = new CubicBezierCurve3(
      vector(THREE, path.start),
      vector(THREE, path.first),
      vector(THREE, path.second),
      vector(THREE, path.end),
    );
    const segments = 76;
    const ribbon = createRibbonGeometry(THREE, curve, 0.042 + (index % 3) * 0.006, 0.016, segments);
    const bodyGeometry = ownGeometry(ribbon.geometry);
    const body = new Mesh(bodyGeometry, index % 2 === 0 ? midMetal : steelMaterial);
    const edge = new Line(ownGeometry(new BufferGeometry().setFromPoints(ribbon.edgePoints)), edgeMaterial);
    const highlight = new Line(ownGeometry(new BufferGeometry().setFromPoints(ribbon.highlightPoints)), highlightMaterial);
    const filamentCurve = new CubicBezierCurve3(
      vector(THREE, path.start),
      vector(THREE, path.start).multiplyScalar(0.72).add(new Vector3(0.08, 0.3, 0.16)),
      vector(THREE, path.end).multiplyScalar(0.74).add(new Vector3(-0.06, -0.28, 0.12)),
      vector(THREE, path.end),
    );
    const filament = new Line(ownGeometry(new BufferGeometry().setFromPoints(filamentCurve.getPoints(58))), filamentMaterial);

    const node = new Group();
    node.position.copy(curve.getPointAt(0));
    node.add(new Mesh(nodeGeometry, index % 2 === 0 ? nodeMaterial : blueNodeMaterial));
    const clampMesh = new Mesh(clampGeometry, steelMaterial);
    clampMesh.position.copy(curve.getPointAt(1));
    clampMesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), curve.getTangentAt(1).normalize());

    group.add(body, edge, highlight, filament, node, clampMesh);
    ribbons.push({
      body,
      edge,
      highlight,
      filament,
      node,
      clamp: clampMesh,
      segments,
      indexCount: bodyGeometry.index?.count ?? 0,
      pointCount: segments + 1,
    });
  });

  const framePositions: number[] = [];
  [-1, 1].forEach((xDirection) => {
    [-1, 1].forEach((yDirection) => {
      const x = xDirection * 2.12;
      const y = yDirection * 2.64;
      framePositions.push(
        x, y, -0.92, x - xDirection * 0.34, y, -0.92,
        x, y, -0.92, x, y - yDirection * 0.34, -0.92,
      );
    });
  });
  const frameGeometry = ownGeometry(new BufferGeometry());
  frameGeometry.setAttribute("position", new Float32BufferAttribute(framePositions, 3));
  group.add(new LineSegments(frameGeometry, frameMaterial));

  return {
    group,
    core,
    base,
    cap,
    layers,
    ribbons,
    coreEdgeMaterial,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}

function applyAssembly(build: SculptureBuild, elapsed: number) {
  const coreProgress = easeOut(elapsed / 0.96);
  build.core.scale.setScalar(0.84 + coreProgress * 0.16);
  build.core.position.y = -(1 - coreProgress) * 0.34;
  build.coreEdgeMaterial.opacity = 0.18 + coreProgress * 0.34;

  const baseProgress = easeOut(elapsed / 0.7);
  build.base.visible = elapsed > 0.02;
  build.base.scale.setScalar(0.9 + baseProgress * 0.1);
  build.base.position.y = -(1 - baseProgress) * 0.28;

  const capProgress = easeOut((elapsed - 0.42) / 0.7);
  build.cap.visible = elapsed > 0.42;
  build.cap.position.y = (1 - capProgress) * 0.58;
  build.cap.scale.setScalar(0.88 + capProgress * 0.12);

  build.layers.forEach((layer, index) => {
    const local = clamp((elapsed - 0.08 - index * 0.075) / 0.76);
    const progress = easeOut(local);
    layer.group.visible = local > 0;
    layer.group.position.y = layer.home.y - (1 - progress) * 0.62;
    layer.group.position.x = layer.home.x + (1 - progress) * 0.12;
    layer.group.scale.setScalar(0.88 + progress * 0.12);
    layer.group.rotation.z = layer.tilt + (1 - progress) * 0.035;
  });

  build.ribbons.forEach((ribbon, index) => {
    const local = clamp((elapsed - 0.2 - index * 0.045) / 0.88);
    const progress = easeOut(local);
    const drawnSegments = Math.min(ribbon.segments, Math.floor(progress * ribbon.segments));
    const drawCount = drawnSegments * 24 + (progress === 1 ? 12 : 0);
    ribbon.body.geometry.setDrawRange(0, Math.min(ribbon.indexCount, drawCount));
    ribbon.edge.geometry.setDrawRange(0, Math.min(ribbon.pointCount, Math.ceil(progress * ribbon.pointCount)));
    ribbon.highlight.geometry.setDrawRange(0, Math.min(ribbon.pointCount, Math.ceil(progress * ribbon.pointCount)));
    ribbon.filament.geometry.setDrawRange(0, Math.min(59, Math.ceil(progress * 59)));
    ribbon.node.visible = local > 0;
    ribbon.node.scale.setScalar(0.82 + easeOut(local * 4) * 0.18);
    ribbon.clamp.visible = progress > 0.82;
    ribbon.clamp.scale.setScalar(0.8 + easeOut((progress - 0.82) / 0.18) * 0.2);
  });
}

function platePoints(x: number, y: number, width: number, depth: number) {
  return `${x},${y - depth / 2} ${x + width},${y} ${x},${y + depth / 2} ${x - width},${y}`;
}

function SculptureFallback() {
  const id = useId().replace(/:/g, "");
  const flowPaths = [
    "M 258 654 C 246 548 292 474 324 386 S 314 232 360 154",
    "M 322 658 C 310 552 340 472 352 390 S 342 232 382 148",
    "M 398 662 C 410 548 396 468 402 388 S 408 230 402 146",
    "M 472 650 C 492 548 448 470 448 390 S 462 234 426 154",
    "M 536 630 C 552 532 492 458 474 384 S 474 238 438 164",
    "M 244 574 C 236 480 280 420 326 350 S 330 238 366 174",
  ];

  return (
    <svg
      className="ecosystem-sculpture__fallback"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#173743" stopOpacity="0.68" />
          <stop offset="0.62" stopColor="#09151e" stopOpacity="0.16" />
          <stop offset="1" stopColor="#09151e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={STEEL} />
          <stop offset="0.42" stopColor="#314852" />
          <stop offset="1" stopColor="#788a93" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#29434e" />
          <stop offset="0.5" stopColor="#10232e" />
          <stop offset="1" stopColor="#07141d" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b1b25" />
          <stop offset="0.48" stopColor="#2d5961" />
          <stop offset="0.52" stopColor="#0d202a" />
          <stop offset="1" stopColor="#07131c" />
        </linearGradient>
        <linearGradient id={`${id}-spine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WARM_WHITE} />
          <stop offset="0.45" stopColor={CYAN} />
          <stop offset="1" stopColor={DEEP_BLUE} />
        </linearGradient>
      </defs>

      <ellipse cx="400" cy="402" rx="330" ry="344" fill={`url(#${id}-halo)`} />
      <g fill="none" stroke={STEEL} strokeOpacity="0.24" strokeWidth="1">
        <path d="M174 196h-28v28M626 196h28v28M174 644h-28v-28M626 644h28v-28" />
        <path d="M174 236h-12M174 276h-7M626 236h12M626 276h7" />
      </g>

      <g fill="none" strokeLinecap="round">
        {flowPaths.map((path, index) => (
          <g key={`flow-${index}`}>
            <path d={path} stroke={`url(#${id}-metal)`} strokeWidth="8" strokeOpacity="0.92" />
            <path d={path} stroke={index % 2 === 0 ? CYAN : DEEP_BLUE} strokeWidth="2" strokeOpacity="0.88" />
            <path d={path} stroke={WARM_WHITE} strokeWidth="0.7" strokeOpacity="0.32" transform="translate(-2 -1)" />
          </g>
        ))}
      </g>

      <g>
        <polygon points="386,174 418,190 426,224 418,626 386,644 354,626 346,224 354,190" fill={`url(#${id}-core)`} stroke={STEEL} strokeOpacity="0.72" strokeWidth="1.4" />
        <polygon points="386,188 418,204 418,610 386,626 354,610 354,204" fill="none" stroke={CYAN} strokeOpacity="0.42" strokeWidth="1" />
        <path d="M386 202v404" stroke={`url(#${id}-spine)`} strokeWidth="5" strokeLinecap="round" />
        <path d="M365 216v382M407 216v382" stroke={STEEL} strokeOpacity="0.62" strokeWidth="2" />
        {[242, 326, 410, 494, 578].map((y) => <path key={`cross-${y}`} d={`M354 ${y}l32 12 32-12`} fill="none" stroke={CYAN} strokeOpacity="0.48" strokeWidth="1.5" />)}
      </g>

      <g transform="translate(0 8)">
        {FALLBACK_LAYERS.map((layer, index) => {
          const top = platePoints(layer.x, layer.y, layer.width, layer.depth);
          const left = `${layer.x - layer.width},${layer.y} ${layer.x},${layer.y + layer.depth / 2} ${layer.x},${layer.y + layer.depth / 2 + 20} ${layer.x - layer.width},${layer.y + 20}`;
          const right = `${layer.x + layer.width},${layer.y} ${layer.x},${layer.y + layer.depth / 2} ${layer.x},${layer.y + layer.depth / 2 + 20} ${layer.x + layer.width},${layer.y + 20}`;
          return (
            <g key={`layer-${index}`} transform={`rotate(${layer.tilt} ${layer.x} ${layer.y})`}>
              <polygon points={left} fill="#0a1821" stroke={STEEL} strokeOpacity="0.46" strokeWidth="1" />
              <polygon points={right} fill="#132934" stroke={STEEL} strokeOpacity="0.58" strokeWidth="1" />
              <polygon points={top} fill={`url(#${id}-top)`} stroke={`url(#${id}-metal)`} strokeWidth="2" />
              <polygon points={platePoints(layer.x, layer.y - 2, layer.width - 22, layer.depth - 18)} fill="none" stroke={CYAN} strokeOpacity="0.28" strokeWidth="1" />
              <path d={`M${layer.x - layer.width * 0.58} ${layer.y - layer.depth * 0.16}h${layer.width * 0.7}v${layer.depth * 0.34}`} fill="none" stroke={CYAN} strokeOpacity="0.42" strokeWidth="1" />
              <path d={`M${layer.x - layer.width * 0.18} ${layer.y + layer.depth * 0.22}h${layer.width * 0.34}`} fill="none" stroke={CYAN} strokeOpacity="0.32" strokeWidth="1" />
              {[-0.27, 0, 0.27].map((offset, nodeIndex) => (
                <rect key={`status-${nodeIndex}`} x={layer.x + layer.width * offset - 4} y={layer.y + layer.depth / 2 + 6} width="8" height="4" rx="1" fill={nodeIndex === 1 ? DEEP_BLUE : CYAN} />
              ))}
            </g>
          );
        })}
      </g>

      <g>
        <polygon points="264,672 400,608 536,672 536,692 400,756 264,692" fill="#0a1821" stroke={STEEL} strokeOpacity="0.58" strokeWidth="1.5" />
        <polygon points="264,672 400,608 536,672 400,736" fill={`url(#${id}-top)`} stroke={`url(#${id}-metal)`} strokeWidth="2" />
        <polygon points="324,140 400,104 476,140 476,158 400,194 324,158" fill="#132934" stroke={`url(#${id}-metal)`} strokeWidth="1.5" />
        <polygon points="324,140 400,104 476,140 400,176" fill={`url(#${id}-top)`} stroke={CYAN} strokeOpacity="0.55" strokeWidth="1" />
        <polygon points="400,88 414,104 400,120 386,104" fill={CYAN} />
      </g>

      <g fill={STEEL} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.6" opacity="0.66">
        <text x="176" y="176">DT—01</text>
        <text x="176" y="192">SYSTEMS ENGINE</text>
        <text x="624" y="674" textAnchor="end">EXPLODED ARCHITECTURE</text>
      </g>
    </svg>
  );
}

export default function EcosystemSculpture({ className }: EcosystemSculptureProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SculptureState>("fallback");

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    let renderer: WebGLRenderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let build: SculptureBuild | null = null;
    let threeModule: ThreeModule | null = null;
    let RoomEnvironment: typeof import("three/addons/environments/RoomEnvironment.js").RoomEnvironment | null = null;
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

    const ensureEnvironment = () => {
      if (!renderer || !scene || !threeModule || !RoomEnvironment || environmentTarget) return;
      const room = new RoomEnvironment();
      const generator = new threeModule.PMREMGenerator(renderer);
      try {
        environmentTarget = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
        scene.environment = environmentTarget.texture;
        scene.environmentIntensity = 0.85;
      } finally {
        room.dispose();
        generator.dispose();
      }
    };

    const renderFrame = (now: number) => {
      frameId = 0;
      if (!canRender() || !renderer || !build || !scene || !camera) return;
      if (now - lastDrawTime < 1000 / 30) {
        frameId = requestAnimationFrame(renderFrame);
        return;
      }
      lastDrawTime = now;
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.25) : 0;
      previousTime = now;
      let continuing = false;

      try {
        ensureEnvironment();
        if (!reducedMotion && !assembled) {
          if (assemblyStartedAt === null) assemblyStartedAt = now;
          elapsed = Math.min(ASSEMBLY_SECONDS, (now - assemblyStartedAt) / 1000);
          applyAssembly(build, elapsed);
          continuing = elapsed < ASSEMBLY_SECONDS;
          if (!continuing) assembled = true;
        }

        if (assembled && !reducedMotion && finePointer) {
          turntableAngle = (turntableAngle + delta * TURN_SPEED) % (Math.PI * 2);
          continuing = true;
          const springX = stepSpring(pointerX, velocityX, targetX, delta);
          const springY = stepSpring(pointerY, velocityY, targetY, delta);
          pointerX = springX.position;
          pointerY = springY.position;
          velocityX = springX.velocity;
          velocityY = springY.velocity;
          const settled = Math.abs(targetX - pointerX) < 0.0002
            && Math.abs(targetY - pointerY) < 0.0002
            && Math.abs(velocityX) < 0.0004
            && Math.abs(velocityY) < 0.0004;
          if (settled) {
            pointerX = targetX;
            pointerY = targetY;
            velocityX = 0;
            velocityY = 0;
          } else {
            continuing = true;
          }
        }

        build.group.rotation.set(BASE_ROTATION.x + pointerX, BASE_ROTATION.y + turntableAngle + pointerY, BASE_ROTATION.z);
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

      if (continuing) frameId = requestAnimationFrame(renderFrame);
    };

    const requestFrame = () => {
      if (frameId || !canRender()) return;
      previousTime = performance.now();
      lastDrawTime = 0;
      frameId = requestAnimationFrame(renderFrame);
    };

    const resize = () => {
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
        setState("fallback");
        return;
      }

      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      // The pixel budget, not device DPR, is the hard ceiling.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1_500_000 / (width * height)));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer || reducedMotion || !assembled) return;
      const bounds = root.getBoundingClientRect();
      targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.14;
      targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.09;
      requestFrame();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      requestFrame();
    };

    const onVisibilityChange = () => {
      pageVisible = document.visibilityState !== "hidden";
      if (pageVisible) requestFrame();
      else stopFrame();
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
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
      requestFrame();
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
        requestFrame();
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      dispose();
      setState("fallback");
    };

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stopFrame();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      pointerQuery.removeEventListener("change", onPointerCapabilityChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      canvas?.removeEventListener("webglcontextlost", onContextLost);
      canvas?.remove();
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
      threeModule = THREE;
      RoomEnvironment = roomEnvironmentModule.RoomEnvironment;
      scene = new Scene();
      camera = new PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.set(0, 0.12, 9.2);
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
        renderer.toneMappingExposure = 1.08;
        stage.appendChild(canvas);

        build = createSculpture(THREE);
        scene.add(build.group);
        scene.add(new HemisphereLight(WARM_WHITE, "#06101b", 1.4));
        const keyLight = new DirectionalLight(WARM_WHITE, 2.8);
        keyLight.position.set(3, 5, 6);
        const rimLight = new DirectionalLight(CYAN, 2.4);
        rimLight.position.set(-4, 1, -3);
        const fillLight = new DirectionalLight(STEEL, 0.8);
        fillLight.position.set(-3, -2, 4);
        const topLight = new DirectionalLight(WARM_WHITE, 1.1);
        topLight.position.set(-1, 4, -5);
        const blueLight = new PointLight(DEEP_BLUE, 5, 9, 2);
        blueLight.position.set(1, -2, 3);
        scene.add(keyLight, rimLight, fillLight, topLight, blueLight);

        if (reducedMotion) applyAssembly(build, ASSEMBLY_SECONDS);
        else applyAssembly(build, 0);
        build.group.rotation.set(BASE_ROTATION.x, BASE_ROTATION.y, BASE_ROTATION.z);

        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("pointerleave", onPointerLeave);
        document.addEventListener("visibilitychange", onVisibilityChange);
        motionQuery.addEventListener("change", onMotionChange);
        pointerQuery.addEventListener("change", onPointerCapabilityChange);

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resizeObserver.observe(canvas);
        if (typeof IntersectionObserver !== "undefined") {
          intersectionObserver = new IntersectionObserver((entries) => {
            intersecting = entries.some((entry) => entry.isIntersecting);
            if (intersecting) requestFrame();
            else stopFrame();
          });
          intersectionObserver.observe(root);
        } else {
          intersecting = true;
        }
        resize();
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
  }, []);

  return (
    <div
      ref={rootRef}
      className={["ecosystem-sculpture", className].filter(Boolean).join(" ")}
      data-sculpture="systems-engine"
      data-state={state}
      aria-hidden="true"
    >
      <SculptureFallback />
      <div ref={stageRef} className="ecosystem-sculpture__stage" aria-hidden="true" />
    </div>
  );
}
