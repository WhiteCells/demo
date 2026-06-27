import {
  BarChart3,
  Circle,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Settings2,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";

const iconMap = {
  "bar-chart-3": BarChart3,
  circle: Circle,
  "folder-kanban": FolderKanban,
  "key-round": KeyRound,
  "layout-dashboard": LayoutDashboard,
  "settings-2": Settings2,
  shield: Shield,
  "user-circle-2": UserCircle2,
  users: Users,
};

export function MenuIcon({ name, size = 18 }) {
  const Icon = iconMap[name] || Circle;
  return <Icon size={size} strokeWidth={1.9} />;
}
