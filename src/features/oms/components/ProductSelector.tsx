import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Search, Package, Barcode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  sku_interno: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  quantidade_atual: number;
  codigo_barras?: string;
}

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export function ProductSelector({ 
  onSelect, 
  placeholder = "Pesquise por descrição, código (SKU) ou código de barras" 
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock products data - replace with real data from Supabase
  const { data: products = [] } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      // For now, return mock data
      // Later, implement real Supabase query
      const mockProducts: Product[] = [
        {
          id: "1",
          sku_interno: "PROD-001",
          nome: "Notebook Dell Inspiron 15",
          categoria: "Eletrônicos",
          preco_venda: 2500.00,
          quantidade_atual: 10,
          codigo_barras: "7891234567890"
        },
        {
          id: "2",
          sku_interno: "PROD-002", 
          nome: "Mouse Wireless Logitech",
          categoria: "Acessórios",
          preco_venda: 85.00,
          quantidade_atual: 25,
          codigo_barras: "7891234567891"
        },
        {
          id: "3",
          sku_interno: "PROD-003",
          nome: "Teclado Mecânico RGB",
          categoria: "Acessórios",
          preco_venda: 350.00,
          quantidade_atual: 15,
          codigo_barras: "7891234567892"
        }
      ];

      if (!searchTerm) return mockProducts;
      
      return mockProducts.filter(product => 
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo_barras?.includes(searchTerm)
      );
    },
    enabled: open || searchTerm.length > 0
  });

  const handleSelect = (product: Product) => {
    onSelect(product);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-10"
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>
              <div className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum produto encontrado
                </p>
              </div>
            </CommandEmpty>
            
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => handleSelect(product)}
                  className="flex items-center space-x-3 p-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{product.nome}</p>
                      <span className="text-sm font-medium text-green-600">
                        R$ {product.preco_venda.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Barcode className="w-3 h-3 mr-1" />
                        {product.sku_interno}
                      </span>
                      <span>Est: {product.quantidade_atual}</span>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {product.categoria}
                      </span>
                    </div>
                    
                    {product.codigo_barras && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Código de barras: {product.codigo_barras}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}