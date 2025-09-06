import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkuMappingStats } from "@/hooks/useSkuMappings";

interface SkuMapStatsProps {
  onFilterClick?: (filterType: 'all' | 'ativos' | 'pendentes' | 'completos') => void;
}

export function SkuMapStats({ onFilterClick }: SkuMapStatsProps = {}) {
  const { data: stats, isLoading } = useSkuMappingStats();

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-2 md:grid md:grid-cols-4 md:gap-6 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-shrink-0 min-w-[70px] md:min-w-0">
            <CardContent className="p-3 md:p-6">
              <div className="text-center space-y-1 md:space-y-2">
                <Skeleton className="h-4 w-8 mx-auto md:h-8 md:w-16" />
                <Skeleton className="h-3 w-12 mx-auto md:h-4 md:w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total",
      value: stats?.total || 0,
      color: "text-primary",
      filterType: 'all' as const,
    },
    {
      label: "Ativos",
      value: stats?.ativos || 0,
      color: "text-success",
      filterType: 'ativos' as const,
    },
    {
      label: "Pendentes",
      value: stats?.pendentes || 0,
      color: "text-warning",
      filterType: 'pendentes' as const,
    },
    {
      label: "Completos",
      value: stats?.completos || 0,
      color: "text-info",
      filterType: 'completos' as const,
    },
  ];

  const handleCardClick = (filterType: 'all' | 'ativos' | 'pendentes' | 'completos') => {
    if (onFilterClick) {
      onFilterClick(filterType);
    }
  };

  return (
    <div className="flex overflow-x-auto gap-2 md:grid md:grid-cols-4 md:gap-6 pb-2">
      {statCards.map((stat) => (
        <Card 
          key={stat.label} 
          className={`flex-shrink-0 min-w-[70px] md:min-w-0 ${onFilterClick ? 'lg:cursor-default md:cursor-pointer cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
          onClick={() => onFilterClick && handleCardClick(stat.filterType)}
        >
          <CardContent className="p-3 md:p-6">
            <div className="text-center">
              <div className={`text-lg font-bold md:text-2xl ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}