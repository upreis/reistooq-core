import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useOMSCustomers } from "../hooks/useOMSData";

export interface Customer {
  id: string;
  name: string;
  doc: string | null;
  email: string | null;
  phone: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cep: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
}

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  placeholder?: string;
}

export function CustomerSelector({ 
  value, 
  onChange, 
  placeholder = "Pesquise pelo nome, CPF/CNPJ ou e-mail do cliente" 
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useOMSCustomers(searchTerm);

  const handleSelect = (customer: any) => {
    const mappedCustomer: Customer = {
      id: customer.id,
      name: customer.name,
      doc: customer.doc,
      email: customer.email,
      phone: customer.phone,
      endereco_rua: customer.endereco_rua,
      endereco_numero: customer.endereco_numero,
      endereco_bairro: customer.endereco_bairro,
      endereco_cep: customer.endereco_cep,
      endereco_cidade: customer.endereco_cidade,
      endereco_uf: customer.endereco_uf
    };
    onChange(mappedCustomer);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm("");
  };

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
                  <span className="font-medium">{value.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {value.doc} {value.endereco_cidade && `• ${value.endereco_cidade}, ${value.endereco_uf}`}
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
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhum cliente encontrado
                      </p>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Cadastrar novo cliente
                      </Button>
                    </>
                  )}
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
                        <p className="font-medium">{customer.name}</p>
                        <span className="text-sm text-muted-foreground">
                          {customer.endereco_cidade}, {customer.endereco_uf}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{customer.doc}</span>
                        {customer.email && <span>{customer.email}</span>}
                        {customer.phone && <span>{customer.phone}</span>}
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
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  Dados do cliente
                </Button>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  Ver últimas vendas
                </Button>
              </div>
              {value && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="text-destructive"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}