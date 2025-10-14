import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, FileCheck, Image, Award, MessageCircle } from 'lucide-react';
import { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface ProductQualityTabProps {
  devolucao: any; // Usando any temporariamente até tipos serem atualizados
}

export const ProductQualityTab: React.FC<ProductQualityTabProps> = ({ devolucao }) => {
  const getBadgeVariant = (value: boolean | null | undefined) => {
    if (value === true) return 'default';
    if (value === false) return 'secondary';
    return 'outline';
  };

  const getQualityColor = (quality: string | null | undefined) => {
    if (!quality) return 'secondary';
    const lower = quality.toLowerCase();
    if (lower.includes('excelente') || lower.includes('boa') || lower.includes('alta')) return 'default';
    if (lower.includes('média') || lower.includes('regular')) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* FLAGS E INDICADORES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Flags e Indicadores
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Tem Dados Financeiros</Label>
            <Badge variant={getBadgeVariant(devolucao.tem_financeiro)} className="mt-1">
              {devolucao.tem_financeiro ? '✓ Sim' : '✗ Não'}
            </Badge>
          </div>
          <div>
            <Label>Tem Review</Label>
            <Badge variant={getBadgeVariant(devolucao.tem_review)} className="mt-1">
              {devolucao.tem_review ? '✓ Sim' : '✗ Não'}
            </Badge>
          </div>
          <div>
            <Label>Tem SLA</Label>
            <Badge variant={getBadgeVariant(devolucao.tem_sla)} className="mt-1">
              {devolucao.tem_sla ? '✓ Sim' : '✗ Não'}
            </Badge>
          </div>
          <div>
            <Label>Nota Fiscal Autorizada</Label>
            <Badge variant={getBadgeVariant(devolucao.nota_fiscal_autorizada)} className="mt-1">
              {devolucao.nota_fiscal_autorizada ? '✓ Sim' : '✗ Não'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* INFORMAÇÕES DO PRODUTO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Garantia do Produto</Label>
            <p className="font-medium">{devolucao.produto_warranty || '-'}</p>
          </div>
          <div>
            <Label>Categoria</Label>
            <Badge variant="outline" className="mt-1">
              {devolucao.produto_categoria || '-'}
            </Badge>
          </div>
          <div className="md:col-span-3">
            <Label>Thumbnail do Produto</Label>
            {devolucao.produto_thumbnail ? (
              <div className="mt-2">
                <img 
                  src={devolucao.produto_thumbnail} 
                  alt="Produto" 
                  className="h-32 w-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="mt-2 h-32 w-32 bg-muted rounded-lg border flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QUALIDADE E EFICIÊNCIA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Métricas de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Qualidade da Comunicação</Label>
            <Badge 
              variant={getQualityColor(devolucao.qualidade_comunicacao)} 
              className="mt-2 text-sm"
            >
              {devolucao.qualidade_comunicacao || 'Não avaliada'}
            </Badge>
          </div>
          <div>
            <Label>Eficiência da Resolução</Label>
            <Badge 
              variant={getQualityColor(devolucao.eficiencia_resolucao)} 
              className="mt-2 text-sm"
            >
              {devolucao.eficiencia_resolucao || 'Não avaliada'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* TAGS INTERNAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags Internas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {devolucao.internal_tags && Array.isArray(devolucao.internal_tags) && devolucao.internal_tags.length > 0 ? (
              devolucao.internal_tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tag interna registrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
