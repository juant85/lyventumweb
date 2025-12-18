// src/components/Icons.tsx
// Modern icon library using Lucide React
// This file re-exports Lucide icons with backward-compatible names
// to maintain compatibility with existing imports throughout the codebase

import React from 'react';
import {
  LogIn,
  User,
  BarChart3,
  QrCode,
  Settings,
  Table2,
  Edit,
  Trash2,
  Download,
  PlusCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  Wifi,
  WifiOff,
  ArrowLeft,
  Menu,
  X,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Store,
  FileBarChart,
  Linkedin,
  Users,
  UserPlus,
  Upload,
  ClipboardCheck,
  Search,
  Star,
  Copy,
  FileText,
  UserCircle,
  Presentation,
  Eye,
  MessageCircle,
  Sun,
  Moon,
  Send,
  BellRing,
  BellOff,
  Signal,
  UserMinus,
  Filter,
  PieChart,
  Printer,
  Camera,
  ChevronUp,
  ChevronDown,
  Key,
  Map,
  Mail,
  MailOpen,
  MousePointerClick,
  type LucideProps
} from 'lucide-react';

// Icon props interface for backward compatibility
interface IconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
  className?: string;
}

// Helper function to create wrapped icon components
// This ensures all icons work with the same props as before
const createIconWrapper = (LucideIcon: React.FC<LucideProps>) => {
  return (props: IconProps) => {
    const { title, className, ...rest } = props;
    return (
      <LucideIcon
        className={className}
        aria-label={title}
        strokeWidth={1.5}
        {...(rest as any)}
      />
    );
  };
};

// Export all icons with their original names for backward compatibility
export const LoginIcon = createIconWrapper(LogIn);
export const UserIcon = createIconWrapper(User);
export const ChartBarIcon = createIconWrapper(BarChart3);
export const QrCodeIcon = createIconWrapper(QrCode);
export const CogIcon = createIconWrapper(Settings);
export const TableCellsIcon = createIconWrapper(Table2);
export const PencilSquareIcon = createIconWrapper(Edit);
export const TrashIcon = createIconWrapper(Trash2);
export const DocumentArrowDownIcon = createIconWrapper(Download);
export const PlusCircleIcon = createIconWrapper(PlusCircle);
export const ArrowPathIcon = createIconWrapper(RefreshCw);
export const ClockIcon = createIconWrapper(Clock);
export const ExclamationTriangleIcon = createIconWrapper(AlertTriangle);
export const InformationCircleIcon = createIconWrapper(Info);
export const WifiIcon = createIconWrapper(Wifi);
export const WifiSlashIcon = createIconWrapper(WifiOff);
export const ArrowLeftIcon = createIconWrapper(ArrowLeft);
export const MenuIcon = createIconWrapper(Menu);
export const XMarkIcon = createIconWrapper(X);
export const CheckCircleIcon = createIconWrapper(CheckCircle);
export const XCircleIcon = createIconWrapper(XCircle);
export const ArrowRightIcon = createIconWrapper(ArrowRight);
export const TrendingUpIcon = createIconWrapper(TrendingUp);
export const BuildingStorefrontIcon = createIconWrapper(Store);
export const DocumentChartBarIcon = createIconWrapper(FileBarChart);
export const LinkedinIcon = createIconWrapper(Linkedin);
export const UsersGroupIcon = createIconWrapper(Users);
export const UserPlusIcon = createIconWrapper(UserPlus);
export const ArrowUpTrayIcon = createIconWrapper(Upload);
export const ClipboardDocumentCheckIcon = createIconWrapper(ClipboardCheck);
export const MagnifyingGlassIcon = createIconWrapper(Search);
export const StarIcon = createIconWrapper(Star);
export const DocumentDuplicateIcon = createIconWrapper(Copy);
export const DocumentTextIcon = createIconWrapper(FileText);
export const UserCircleIcon = createIconWrapper(UserCircle);
export const PresentationChartLineIcon = createIconWrapper(Presentation);
export const EyeIcon = createIconWrapper(Eye);
export const ChatBubbleLeftRightIcon = createIconWrapper(MessageCircle);
export const SunIcon = createIconWrapper(Sun);
export const MoonIcon = createIconWrapper(Moon);
export const PaperAirplaneIcon = createIconWrapper(Send);
export const BellAlertIcon = createIconWrapper(BellRing);
export const BellSlashIcon = createIconWrapper(BellOff);
export const SignalIcon = createIconWrapper(Signal);
export const UserMinusIcon = createIconWrapper(UserMinus);
export const FunnelIcon = createIconWrapper(Filter);
export const ChartPieIcon = createIconWrapper(PieChart);
export const PrinterIcon = createIconWrapper(Printer);
export const CameraIcon = createIconWrapper(Camera);
export const ChevronUpIcon = createIconWrapper(ChevronUp);
export const ChevronDownIcon = createIconWrapper(ChevronDown);
export const KeyIcon = createIconWrapper(Key);
export const MapIcon = createIconWrapper(Map);
export const EnvelopeIcon = createIconWrapper(Mail);
export const EnvelopeOpenIcon = createIconWrapper(MailOpen);
export const CursorArrowRaysIcon = createIconWrapper(MousePointerClick);