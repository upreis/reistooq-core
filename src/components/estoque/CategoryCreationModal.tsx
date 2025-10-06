import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileSpreadsheet } from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { useToast } from "@/hooks/use-toast";

const categorySchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  cor: z.string().default("#6366f1"),
  icone: z.string().optional(),
  nivel: z.enum(["1", "2"]),
  categoria_principal_id: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const PREDEFINED_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#84cc16"
];

const PREDEFINED_ICONS = [
  "Package", "ShoppingBag", "Shirt", "Laptop",
  "Book", "Car", "Home", "Heart"
];

interface CategoryCreationModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CategoryCreationModal({ trigger, onSuccess }: CategoryCreationModalProps) {
  const [open, setOpen] = useState(false);
  const { createCategory, getCategoriasPrincipais } = useHierarchicalCategories();
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: "",
      descricao: "",
      cor: "#6366f1",
      icone: "",
      nivel: "1",
    },
  });

  const selectedNivel = form.watch("nivel");

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await createCategory({
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor,
        icone: data.icone,
        nivel: parseInt(data.nivel) as 1 | 2,
        categoria_principal_id: data.categoria_principal_id,
      });

      toast({
        title: "Categoria criada",
        description: "Categoria criada com sucesso!",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível da Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Nível 1</Badge>
                          Categoria Principal
                        </div>
                      </SelectItem>
                      <SelectItem value="2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Nível 2</Badge>
                          Categoria
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedNivel === "2" && (
              <FormField
                control={form.control}
                name="categoria_principal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Principal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria principal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategoriasPrincipais().map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da categoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição da categoria"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input type="color" {...field} className="h-10" />
                      </FormControl>
                      <div className="flex flex-wrap gap-1">
                        {PREDEFINED_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="w-6 h-6 rounded border border-border"
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREDEFINED_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Criar Categoria
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}