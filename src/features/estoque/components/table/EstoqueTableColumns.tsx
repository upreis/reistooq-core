/**
 * 📋 DEFINIÇÕES DE COLUNAS DA TABELA DE ESTOQUE
 * Configurações centralizadas das colunas da tabela
 */

import { Product } from "@/hooks/useProducts";
import { ProductTypeBadges, StatusBadges, ActiveStatusBadge, OnDemandBadge } from "./EstoqueTableBadges";
import { formatPrice, formatDimensions } from "../../utils/stockFormatters";

export interface ColumnDefinition {
  key: string;
  label: string;
  primary?: boolean;
  sortable?: boolean;
  width?: string;
  render: (value: any, product: Product) => JSX.Element | string;
}

interface GetColumnsParams {
  parentSkus?: Set<string>;
  parentAggregatedData?: Map<string, { custoTotal: number; vendaTotal: number }>;
  allProducts?: Product[]; // Array completo para cálculos de produtos PAI
}

export function getEstoqueTableColumns({ 
  parentSkus, 
  parentAggregatedData,
  allProducts = []
}: GetColumnsParams = {}): ColumnDefinition[] {
  return [
    {
      key: "sku_interno",
      label: "SKU Interno",
      sortable: true,
      width: "250px",
      render: (value: string, product: Product) => {
        const isParent = parentSkus?.has(product.sku_interno);
        const isChild = !!product.sku_pai;
        
        const hasParentSku = !!product.sku_pai;
        const parentExists = hasParentSku && parentSkus ? parentSkus.has(product.sku_pai) : true;
        const isOrphan = parentSkus && hasParentSku && !parentExists;
        
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <ProductTypeBadges isParent={isParent} isChild={isChild} />
              <div className="font-mono text-[11px] font-semibold">{value}</div>
            </div>
            <StatusBadges 
              product={product} 
              isParent={isParent} 
              isOrphan={isOrphan}
              allProducts={allProducts}
            />
          </div>
        );
      }
    },
    {
      key: "sku_pai",
      label: "SKU Pai",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block">{value || "-"}</span>
      )
    },
    {
      key: "nome",
      label: "Nome",
      primary: true,
      sortable: true,
      width: "200px",
      render: (value: string) => (
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[11px] leading-tight line-clamp-2">
            {value}
          </p>
        </div>
      )
    },
    {
      key: "descricao",
      label: "Descrição",
      width: "250px",
      render: (value: string) => (
        <span className="text-[11px] block line-clamp-2 max-w-[250px]" title={value}>
          {value || "-"}
        </span>
      )
    },
    {
      key: "categoria_principal",
      label: "Categoria Principal",
      sortable: true,
      width: "150px",
      render: (value: string) => (
        <span className="text-[11px] block line-clamp-2 max-w-[150px]" title={value}>
          {value || "-"}
        </span>
      )
    },
    {
      key: "categoria",
      label: "Categoria",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block line-clamp-2 max-w-[120px]" title={value}>
          {value || "-"}
        </span>
      )
    },
    {
      key: "quantidade_atual",
      label: "Quantidade",
      sortable: true,
      width: "100px",
      render: (value: number) => (
        <div className="text-center text-[11px] font-semibold">{value}</div>
      )
    },
    {
      key: "estoque_minimo",
      label: "Qdd Minima",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">{value}</span>
      )
    },
    {
      key: "estoque_maximo",
      label: "Qdd Maxima",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">{value}</span>
      )
    },
    {
      key: "preco_custo",
      label: "Preço Custo",
      sortable: true,
      width: "100px",
      render: (value: number, product: Product) => {
        if (parentSkus?.has(product.sku_interno) && parentAggregatedData?.has(product.sku_interno)) {
          const data = parentAggregatedData.get(product.sku_interno)!;
          return (
            <div className="text-[11px]">
              <div className="text-muted-foreground text-[10px]">Custo Total:</div>
              <div className="font-semibold">{formatPrice(data.custoTotal)}</div>
            </div>
          );
        }
        return <span className="text-[11px]">{formatPrice(value)}</span>;
      }
    },
    {
      key: "preco_venda",
      label: "Preço Venda",
      sortable: true,
      width: "100px",
      render: (value: number, product: Product) => {
        if (parentSkus?.has(product.sku_interno) && parentAggregatedData?.has(product.sku_interno)) {
          const data = parentAggregatedData.get(product.sku_interno)!;
          return (
            <div className="text-[11px]">
              <div className="text-muted-foreground text-[10px]">Venda Total:</div>
              <div className="font-semibold">{formatPrice(data.vendaTotal)}</div>
            </div>
          );
        }
        return <span className="text-[11px]">{formatPrice(value)}</span>;
      }
    },
    {
      key: "url_imagem",
      label: "URL Imagem",
      width: "150px",
      render: (value: string) => (
        <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]" title={value}>
          {value || "-"}
        </div>
      )
    },
    {
      key: "ativo",
      label: "Status",
      sortable: true,
      width: "80px",
      render: (value: boolean) => <ActiveStatusBadge isActive={value} />
    },
    {
      key: "localizacao",
      label: "Localização",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block">{value || "-"}</span>
      )
    },
    {
      key: "peso_bruto_kg",
      label: "Peso Bruto",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">{value || "-"}</span>
      )
    },
    {
      key: "peso_liquido_kg",
      label: "Peso Líquido",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">{value || "-"}</span>
      )
    },
    {
      key: "dimensoes",
      label: "Dimensões (LxAxC)",
      width: "120px",
      render: (_, product: Product) => (
        <span className="text-[10px]">
          {formatDimensions(product.largura, product.altura, product.comprimento)}
        </span>
      )
    },
    {
      key: "numero_volumes",
      label: "Nº Volumes",
      sortable: true,
      width: "80px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">{value || "1"}</span>
      )
    },
    {
      key: "unidade",
      label: "Unidade",
      sortable: true,
      width: "70px",
      render: (value: string) => (
        <span className="text-[11px] block text-center">{value || "UN"}</span>
      )
    },
    {
      key: "sob_encomenda",
      label: "Sob Encomenda",
      sortable: true,
      width: "100px",
      render: (value: boolean) => <OnDemandBadge isOnDemand={value} />
    },
    {
      key: "dias_preparacao",
      label: "Dias Prep.",
      sortable: true,
      width: "80px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value && value > 0 ? value : "-"}
        </span>
      )
    },
    {
      key: "tipo_embalagem",
      label: "Tipo Embalagem",
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block truncate">{value || "-"}</span>
      )
    },
    {
      key: "codigo_barras",
      label: "Código EAN",
      sortable: true,
      width: "130px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block truncate">{value || "-"}</span>
      )
    },
    {
      key: "ncm",
      label: "NCM",
      sortable: true,
      width: "100px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block">{value || "-"}</span>
      )
    },
    {
      key: "codigo_cest",
      label: "Código CEST",
      sortable: true,
      width: "110px",
      render: (value: string) => (
        <span className="text-[10px] font-mono block truncate">{value || "-"}</span>
      )
    },
    {
      key: "origem",
      label: "Origem",
      sortable: true,
      width: "70px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value !== null && value !== undefined ? value : "-"}
        </span>
      )
    },
  ];
}
