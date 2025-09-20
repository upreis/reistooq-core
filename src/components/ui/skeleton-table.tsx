// P3.4: Skeleton loading otimizado para tabelas
import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell, Table, TableHeader, TableHead, TableBody } from '@/components/ui/table';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function SkeletonTable({ rows = 5, columns = 6, showHeader = true }: SkeletonTableProps) {
  return (
    <div className="rounded-lg border border-gray-600 overflow-auto bg-card">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className="whitespace-nowrap">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}