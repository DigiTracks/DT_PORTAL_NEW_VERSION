import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Books,
  Brain,
  Buildings,
  Calculator,
  ChartLineUp,
  Check,
  CheckSquare,
  CircleHalf,
  Clock,
  Code,
  Database,
  FileText,
  FlowArrow,
  FolderOpen,
  Gauge,
  Globe,
  Graph,
  GraduationCap,
  GridFour,
  Heartbeat,
  ListChecks,
  MapTrifold,
  MagnifyingGlass,
  Package,
  Path,
  Pulse,
  Rocket,
  Scales,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  Stack,
  TerminalWindow,
  UsersThree,
  Wrench,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const icons = {
  arrow: ArrowRight,
  external: ArrowUpRight,
  book: BookOpen,
  box: Package,
  brain: Brain,
  building: Buildings,
  calculator: Calculator,
  chart: ChartLineUp,
  check: Check,
  approval: CheckSquare,
  clock: Clock,
  code: Code,
  database: Database,
  document: FileText,
  flow: FlowArrow,
  folder: FolderOpen,
  gauge: Gauge,
  globe: Globe,
  graph: Graph,
  education: GraduationCap,
  grid: GridFour,
  health: Heartbeat,
  layers: Stack,
  library: Books,
  map: MapTrifold,
  search: MagnifyingGlass,
  package: Package,
  path: Path,
  pulse: Pulse,
  rocket: Rocket,
  scorecard: ListChecks,
  scales: Scales,
  shield: ShieldCheck,
  sliders: SlidersHorizontal,
  sparkle: Sparkle,
  terminal: TerminalWindow,
  users: UsersThree,
  tool: Wrench,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}

export default function Icon({ name, size = 20, weight = "regular", className }: IconProps) {
  const Component = icons[name];
  return <Component size={size} weight={weight} className={className} aria-hidden="true" focusable="false" />;
}
