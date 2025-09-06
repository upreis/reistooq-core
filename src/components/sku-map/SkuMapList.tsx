import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useSkuMappings, useDeleteSkuMapping } from "@/hooks/useSkuMappings";
import { SkuMapping, SkuMappingFilters } from "@/types/sku-mapping.types";
import { format } from "date-fns";

interface SkuMapListProps {
  filters: SkuMappingFilters;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: SkuMapping) => void;
  onFiltersChange: (filters: Partial<SkuMappingFilters>) => void;
}

export function SkuMapList({ 
  filters, 
  selectedItems, 
  onSelectionChange, 
  onEdit,
  onFiltersChange 
}: SkuMapListProps) {
  const { data, isLoading, error } = useSkuMappings(filters);
  const deleteMapping = useDeleteSkuMapping();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.data) {
      onSelectionChange(data.data.map(item => item.id!));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter(item => item !== id));
    }
  };

  const handleSort = (column: string) => {
    const newDir = filters.sortBy === column && filters.sortDir === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ sortBy: column, sortDir: newDir });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMapping.mutateAsync(id);
      setDeletingId(null);
    } catch (error) {
      setDeletingId(null);
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="w-4 h-4" />;
    return filters.sortDir === 'asc' ? '↑' : '↓';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Erro ao carregar dados: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapeamentos ({data?.total || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 hidden md:table-cell">
                  <Checkbox
                    checked={selectedItems.length === (data?.data.length || 0) && data?.data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('sku_pedido')}
                    className="h-auto p-0 font-medium"
                  >
                    SKU do Pedido
                    {getSortIcon('sku_pedido')}
                  </Button>
                </TableHead>
                <TableHead>SKU Correto</TableHead>
                <TableHead>SKU Unitário</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('quantidade')}
                    className="h-auto p-0 font-medium"
                  >
                    Quantidade
                    {getSortIcon('quantidade')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('ativo')}
                    className="h-auto p-0 font-medium"
                  >
                    Status
                    {getSortIcon('ativo')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('created_at')}
                    className="h-auto p-0 font-medium"
                  >
                    Criado em
                    {getSortIcon('created_at')}
                  </Button>
                </TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground md:hidden">
                    Nenhum mapeamento encontrado
                  </TableCell>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground hidden md:table-cell">
                    Nenhum mapeamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden md:table-cell">
                      <Checkbox
                        checked={selectedItems.includes(item.id!)}
                        onCheckedChange={(checked) => handleSelectItem(item.id!, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.sku_pedido}</TableCell>
                    <TableCell>{item.sku_correspondente || "-"}</TableCell>
                    <TableCell>{item.sku_simples || "-"}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>
                      <Badge variant={item.ativo ? "default" : "secondary"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {item.observacoes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(item.id!)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o mapeamento do SKU "{item.sku_pedido}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingId(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id!)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((data.page - 1) * data.pageSize) + 1} a{" "}
                {Math.min(data.page * data.pageSize, data.total)} de {data.total} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ page: data.page - 1 })}
                  disabled={data.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === data.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFiltersChange({ page })}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ page: data.page + 1 })}
                  disabled={data.page >= data.totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}