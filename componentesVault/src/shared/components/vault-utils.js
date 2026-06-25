import { createElement } from 'react';
import {
  Cloud,
  File,
  Folder,
  HardDrive,
  Lock,
  Mail,
  Share2,
  Shield,
  Upload,
  Users,
} from 'lucide-react';

export const iconMap = {
  file: File,
  folder: Folder,
  share: Share2,
  storage: HardDrive,
  users: Users,
  upload: Upload,
  cloud: Cloud,
  lock: Lock,
  mail: Mail,
  shield: Shield,
};

export function resolveIcon(icon) {
  if (!icon) return null;
  if (typeof icon === 'string') return iconMap[icon] || File;
  return icon;
}

export function renderIcon(icon, props) {
  const Icon = resolveIcon(icon);
  return Icon ? createElement(Icon, props) : null;
}