import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Indicador visual da categoria */}
            <div className="relative">
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-40" />
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}