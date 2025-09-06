import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkuMappingStats } from "@/hooks/useSkuMappings";

export function SkuMapStats() {
  const { data: stats, isLoading } = useSkuMappingStats();

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-3 md:grid md:grid-cols-4 md:gap-6 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-shrink-0 min-w-[140px] md:min-w-0">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
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
    },
    {
      label: "Ativos",
      value: stats?.ativos || 0,
      color: "text-success",
    },
    {
      label: "Pendentes",
      value: stats?.pendentes || 0,
      color: "text-warning",
    },
    {
      label: "Completos",
      value: stats?.completos || 0,
      color: "text-info",
    },
  ];

  return (
    <div className="flex overflow-x-auto gap-3 md:grid md:grid-cols-4 md:gap-6 pb-2">
      {statCards.map((stat) => (
        <Card key={stat.label} className="flex-shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}