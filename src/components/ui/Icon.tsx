import * as Lucide from "lucide-react";
import { ComponentProps } from "react";

const iconMap = {
  // Core
  dashboard: Lucide.LayoutDashboard,
  qr: Lucide.QrCode,
  scan: Lucide.ScanLine,
  camera: Lucide.Camera,
  visualize: Lucide.BarChart3,
  grid: Lucide.LayoutGrid,
  settings: Lucide.Settings2,
  table: Lucide.Table2,
  edit: Lucide.Pencil,
  sponsor: Lucide.Building2,
  reports: Lucide.FileBarChart2,
  admin: Lucide.ShieldCheck,

  // Pantallas adicionales
  attendees: Lucide.Users,
  profile: Lucide.IdCard,
  registration: Lucide.Notebook,
  booth: Lucide.Store,
  analytics: Lucide.ChartLine,
  realtime: Lucide.Radio,

  // Utilitarios
  chevronUp: Lucide.ChevronUp,
  chevronDown: Lucide.ChevronDown,

  // Added for existing UI components
  chat: Lucide.MessageCircle,
  refresh: Lucide.RefreshCw,
  signal: Lucide.Wifi,
  checkCircle: Lucide.CheckCircle,
  userMinus: Lucide.UserMinus,
  usersGroup: Lucide.Users,
  store: Lucide.Store,
  chartPie: Lucide.PieChart,
  download: Lucide.Download,

  // Kiosk Mode icons
  logout: Lucide.LogOut,
  userCircle: Lucide.UserCircle,
  clock: Lucide.Clock,

  // Fallback icon
  fallback: Lucide.CircleHelp,

  // Added for Sidebar Refinement
  barChart: Lucide.BarChartBig,
  fileText: Lucide.FileText,
  mail: Lucide.Mail,
  users: Lucide.Users,
  briefcase: Lucide.Briefcase,
  database: Lucide.Database,
  calendar: Lucide.CalendarDays,
  qrCode: Lucide.QrCode,
  layers: Lucide.Layers,
  award: Lucide.Award,
  upload: Lucide.Upload,
  userPlus: Lucide.UserPlus,
  map: Lucide.Map,

  // Mobile UI
  home: Lucide.Home,
  menu: Lucide.Menu,
  user: Lucide.User,
  close: Lucide.X,
  plus: Lucide.Plus,
} as const;

export type IconName = keyof typeof iconMap;

type AnyIconProps = ComponentProps<typeof Lucide.QrCode>;
type Props = { name: IconName } & Omit<AnyIconProps, "ref">;

/**
 * Icon: Professional icon wrapper using Lucide React.
 * 
 * Features:
 * - Tree-shakable: Only imports used icons
 * - Accessible: Proper ARIA attributes
 * - Fallback: Shows CircleHelp icon for missing icons
 * - Color inheritance: Uses currentColor by default
 * 
 * @example
 * <Icon name="dashboard" className="w-5 h-5" />
 */
export function Icon({ name, className = "", ...props }: Props) {
  const Cmp = iconMap[name];

  if (!Cmp) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Icon] Missing icon: "${name}"`);
      // Return a visible placeholder in dev to make it obvious
      return (
        <div
          className={`bg-red-500/20 border border-red-500 rounded flex items-center justify-center text-[8px] text-red-500 font-bold ${className}`}
          title={`Missing icon: ${name}`}
          {...(props as any)}
        >
          ?
        </div>
      );
    }
    const FallbackIcon = iconMap.fallback;
    return <FallbackIcon aria-hidden focusable={false} className={`opacity-50 ${className}`} {...props} />;
  }

  return <Cmp aria-hidden focusable={false} className={className} strokeWidth={1.5} {...props} />;
}
