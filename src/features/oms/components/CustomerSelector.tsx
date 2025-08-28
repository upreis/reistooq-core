import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search, Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Customer {
  id: string;
  nome: string;
  documento: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
}

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  placeholder?: string;
}

export function CustomerSelector({ 
  value, 
  onChange, 
  placeholder = "Pesquise pelas iniciais do nome do cliente, pelo cpf/cnpj ou pelo e-mail" 
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock customers data - replace with real data from Supabase
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      // For now, return mock data
      // Later, implement real Supabase query
      const mockCustomers: Customer[] = [
        {
          id: "1",
          nome: "João Silva Santos",
          documento: "123.456.789-00",
          email: "joao@email.com",
          telefone: "(11) 99999-9999",
          cidade: "São Paulo",
          uf: "SP"
        },
        {
          id: "2", 
          nome: "Maria Oliveira",
          documento: "987.654.321-00",
          email: "maria@email.com",
          telefone: "(11) 88888-8888",
          cidade: "Rio de Janeiro",
          uf: "RJ"
        },
        {
          id: "3",
          nome: "Empresa ABC Ltda",
          documento: "12.345.678/0001-90",
          email: "contato@abc.com",
          telefone: "(11) 77777-7777",
          cidade: "Belo Horizonte",
          uf: "MG"
        }
      ];

      if (!searchTerm) return mockCustomers;
      
      return mockCustomers.filter(customer => 
        customer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.documento.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    enabled: open
  });

  const handleSelect = (customer: Customer) => {
    onChange(customer);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm("");
  };

  const displayValue = value 
    ? `${value.nome} - ${value.documento}`
    : "";

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 px-3 py-2"
          >
            <div className="flex flex-col items-start w-full">
              {value ? (
                <>
                  <span className="font-medium">{value.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {value.documento} • {value.cidade}, {value.uf}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-left">
                  {placeholder}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Buscar cliente..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex h-11"
              />
            </div>
            
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhum cliente encontrado
                  </p>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar novo cliente
                  </Button>
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelect(customer)}
                    className="flex items-center space-x-3 p-3"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{customer.nome}</p>
                        <span className="text-sm text-muted-foreground">
                          {customer.cidade}, {customer.uf}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{customer.documento}</span>
                        {customer.email && <span>{customer.email}</span>}
                        {customer.telefone && <span>{customer.telefone}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          
          <div className="border-t p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  Dados do cliente
                </Button>
                <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  Ver últimas vendas
                </Button>
                <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  Limite de crédito
                </Button>
              </div>
              {value && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="text-red-600"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {value && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Endereço:</span> O endereço de entrega do cliente é diferente do endereço de cobrança
            </div>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      )}
    </div>
  );
}