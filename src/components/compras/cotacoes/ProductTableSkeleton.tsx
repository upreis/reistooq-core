import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader para a tabela de produtos da cotação internacional
 * Replica a estrutura da tabela real com animação de loading
 */
export const ProductTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 border-b-2 border-border">
            <TableHead className="w-[50px] h-12"><Skeleton className="h-4 w-4 mx-auto" /></TableHead>
            <TableHead className="min-w-[100px] h-12"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="min-w-[120px] h-12"><Skeleton className="h-4 w-20 mx-auto" /></TableHead>
            <TableHead className="min-w-[150px] h-12"><Skeleton className="h-4 w-24 mx-auto" /></TableHead>
            <TableHead className="min-w-[100px] h-12"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="min-w-[80px] h-12"><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
            <TableHead className="min-w-[200px] h-12"><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead className="min-w-[100px] h-12"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            <TableHead className="min-w-[80px] h-12"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="min-w-[60px] h-12"><Skeleton className="h-4 w-10 mx-auto" /></TableHead>
            <TableHead className="min-w-[80px] h-12"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            <TableHead className="min-w-[80px] h-12"><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index} className="border-b border-border/50">
              {/* Checkbox */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-4 mx-auto" />
              </TableCell>
              {/* SKU */}
              <TableCell className="py-3">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              {/* Imagem Principal */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-16 w-16 mx-auto rounded" />
              </TableCell>
              {/* Imagem Fornecedor */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-16 w-16 mx-auto rounded" />
              </TableCell>
              {/* Material */}
              <TableCell className="py-3">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              {/* Cor */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableCell>
              {/* Nome do Produto */}
              <TableCell className="py-3">
                <Skeleton className="h-4 w-40" />
              </TableCell>
              {/* Package */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-12 mx-auto" />
              </TableCell>
              {/* Preço */}
              <TableCell className="text-right py-3">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
              {/* Unidade */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-12 mx-auto" />
              </TableCell>
              {/* PCS/CTN */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-12 mx-auto" />
              </TableCell>
              {/* Caixas */}
              <TableCell className="text-center py-3">
                <Skeleton className="h-4 w-12 mx-auto" />
              </TableCell>
              {/* Mais algumas células para completar */}
              {Array.from({ length: 6 }).map((_, i) => (
                <TableCell key={i} className="py-3">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
