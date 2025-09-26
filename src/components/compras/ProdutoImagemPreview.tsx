import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";

interface ProdutoImagemPreviewProps {
  imagemUrl?: string;
  imagemFornecedorUrl?: string;
  nomeProduto: string;
  sku: string;
  className?: string;
}

export const ProdutoImagemPreview: React.FC<ProdutoImagemPreviewProps> = ({
  imagemUrl,
  imagemFornecedorUrl,
  nomeProduto,
  sku,
  className = ""
}) => {
  const [imagemDialogOpen, setImagemDialogOpen] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [tipoImagem, setTipoImagem] = useState<'produto' | 'fornecedor'>('produto');

  const abrirImagem = (url: string, tipo: 'produto' | 'fornecedor') => {
    setImagemSelecionada(url);
    setTipoImagem(tipo);
    setImagemDialogOpen(true);
  };

  const temImagens = imagemUrl || imagemFornecedorUrl;

  if (!temImagens) {
    return (
      <div className={`text-center text-muted-foreground p-2 ${className}`}>
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-1 flex items-center justify-center">
          <Eye className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs">Sem imagem</p>
      </div>
    );
  }

  // Se apenas uma imagem foi passada, mostrar layout simplificado
  const imagemUnica = imagemUrl || imagemFornecedorUrl;
  const tipoUnico = imagemUrl ? 'produto' : 'fornecedor';

  if ((imagemUrl && !imagemFornecedorUrl) || (!imagemUrl && imagemFornecedorUrl)) {
    return (
      <>
        <div className={`text-center ${className}`}>
          <div className="relative group">
            <img
              src={imagemUnica}
              alt={`${tipoUnico} ${sku}`}
              className="w-16 h-16 object-cover rounded-lg border mx-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => abrirImagem(imagemUnica!, tipoUnico as 'produto' | 'fornecedor')}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Dialog para visualizar imagem em tamanho maior */}
        <Dialog open={imagemDialogOpen} onOpenChange={setImagemDialogOpen}>
          <DialogContent className="max-w-2xl p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{nomeProduto}</h3>
                <p className="text-sm text-muted-foreground">
                  SKU: {sku} - Imagem do {tipoImagem === 'produto' ? 'Produto' : 'Fornecedor'}
                </p>
              </div>
              
              {imagemSelecionada && (
                <div className="text-center">
                  <img
                    src={imagemSelecionada}
                    alt={`${tipoImagem} ${sku}`}
                    className="max-w-full max-h-96 mx-auto rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  
                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(imagemSelecionada, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir em nova aba
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {/* Imagem do Produto */}
        {imagemUrl && (
          <div className="text-center">
            <div className="relative group">
              <img
                src={imagemUrl}
                alt={`Produto ${sku}`}
                className="w-20 h-20 object-cover rounded-lg border mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => abrirImagem(imagemUrl, 'produto')}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Produto</p>
          </div>
        )}

        {/* Imagem do Fornecedor */}
        {imagemFornecedorUrl && (
          <div className="text-center">
            <div className="relative group">
              <img
                src={imagemFornecedorUrl}
                alt={`Fornecedor ${sku}`}
                className="w-20 h-20 object-cover rounded-lg border mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => abrirImagem(imagemFornecedorUrl, 'fornecedor')}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fornecedor</p>
          </div>
        )}
      </div>

      {/* Dialog para visualizar imagem em tamanho maior */}
      <Dialog open={imagemDialogOpen} onOpenChange={setImagemDialogOpen}>
        <DialogContent className="max-w-2xl p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{nomeProduto}</h3>
              <p className="text-sm text-muted-foreground">
                SKU: {sku} - Imagem do {tipoImagem === 'produto' ? 'Produto' : 'Fornecedor'}
              </p>
            </div>
            
            {imagemSelecionada && (
              <div className="text-center">
                <img
                  src={imagemSelecionada}
                  alt={`${tipoImagem} ${sku}`}
                  className="max-w-full max-h-96 mx-auto rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(imagemSelecionada, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir em nova aba
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};