import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

interface UserProfileSidebarProps {
  user: UserProfile;
  navItems: NavItem[];
  logoutItem: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export const UserProfileSidebar = React.forwardRef<HTMLDivElement, UserProfileSidebarProps>(
  ({ user, navItems, logoutItem, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex h-full w-full flex-col bg-background',
          className
        )}
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        aria-label="Menu de Navegação"
      >
        {/* User Info Header */}
        <motion.div 
          variants={itemVariants} 
          className="p-4 border-b bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Usuário</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto" role="navigation">
          <div className="space-y-1 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.id}
                  href={item.path}
                  variants={itemVariants}
                  className="group flex items-center rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>{item.label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.a>
              );
            })}
          </div>
        </nav>

        {/* Footer with Theme Toggle and Logout */}
        <div className="p-4 border-t bg-muted/30 mt-auto">
          <div className="space-y-2">
            {/* Theme Toggle */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">Tema</span>
              <ThemeToggle />
            </motion.div>

            {/* Logout Button */}
            <motion.button
              variants={itemVariants}
              onClick={logoutItem.onClick}
              className="group flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <logoutItem.icon className="mr-3 h-5 w-5" />
              <span>{logoutItem.label}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
);

UserProfileSidebar.displayName = 'UserProfileSidebar';
