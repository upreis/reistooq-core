import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';

// --- Internal Types and Defaults ---

const DefaultHomeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
const DefaultCompassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>;
const DefaultBellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;

type NavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  onClick?: () => void;
};

const defaultNavItems: NavItem[] = [
  { id: 'default-home', icon: <DefaultHomeIcon />, label: 'Home' },
  { id: 'default-explore', icon: <DefaultCompassIcon />, label: 'Explore' },
  { id: 'default-notifications', icon: <DefaultBellIcon />, label: 'Notifications' },
];

type LimelightNavProps = {
  items?: NavItem[];
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the active item.
 */
export const LimelightNav = ({
  items = defaultNavItems,
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (items.length === 0) return;

    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[activeIndex];
    
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) {
    return null; 
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setActiveIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav className={`relative inline-flex items-center h-20 rounded-2xl bg-background/80 backdrop-blur-sm text-foreground border-2 border-border px-2 ${className}`}>
      {items.map(({ id, icon, label, onClick }, index) => (
          <a
            key={id}
            ref={el => (navItemRefs.current[index] = el)}
            className={`relative z-20 flex h-full cursor-pointer flex-col items-center justify-end pb-3 px-6 gap-1.5 ${iconContainerClassName}`}
            onClick={() => handleItemClick(index, onClick)}
            aria-label={label}
          >
            {cloneElement(icon, {
              className: `w-5 h-5 transition-all duration-300 ease-in-out ${
                activeIndex === index ? 'opacity-100 text-foreground' : 'opacity-70 text-muted-foreground'
              } ${icon.props.className || ''} ${iconClassName || ''}`,
            })}
            {label && (
              <span className={`text-xs font-medium transition-all duration-300 ease-in-out ${
                activeIndex === index ? 'opacity-100 text-foreground' : 'opacity-70 text-muted-foreground'
              }`}>
                {label}
              </span>
            )}
          </a>
      ))}

      {/* Limelight effect - luz acendendo no topo */}
      <div 
        ref={limelightRef}
        className={`absolute top-2 z-10 w-24 h-1 rounded-b-full ${
          isReady ? 'transition-[left] duration-500 ease-out' : ''
        } ${limelightClassName}`}
        style={{ left: '-999px' }}
      >
        {/* Barra de luz no topo */}
        <div className="absolute left-[20%] w-[60%] top-0 h-[6px] bg-primary rounded-b-md shadow-[0_0_20px_hsl(var(--primary)/.8)]" />
        
        {/* Gradiente de luz descendo */}
        <div className="absolute left-[10%] top-0 w-[80%] h-16 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent [clip-path:polygon(20%_0,80%_0,100%_100%,0%_100%)] pointer-events-none blur-sm" />
        
        {/* Glow adicional */}
        <div className="absolute left-[20%] top-0 w-[60%] h-12 bg-gradient-to-b from-primary/60 to-transparent rounded-b-full blur-md pointer-events-none" />
      </div>
    </nav>
  );
};
