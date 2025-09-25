import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CotacoesTab } from "@/components/compras/CotacoesTab";
import { CotacoesInternacionaisTab } from "@/components/compras/CotacoesInternacionaisTab";
import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";

export default function CotacoesPage() {
  const [cotacoes, setCotacoes] = useState([]);
  const [cotacoesInternacionais, setCotacoesInternacionais] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCotacoes, getFornecedores } = useCompras();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cotacoesData, fornecedoresData] = await Promise.all([
        getCotacoes(),
        getFornecedores()
      ]);
      setCotacoes(cotacoesData);
      setFornecedores(fornecedoresData);
      
      // TODO: Aqui você pode adicionar uma chamada para buscar cotações internacionais
      // setCotacoesInternacionais(await getCotacoesInternacionais());
    } catch (error) {
      toast({
        title: "Erro ao carregar cotações",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="nacionais" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nacionais">Cotações Nacionais</TabsTrigger>
          <TabsTrigger value="internacionais">Cotações Internacionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="nacionais">
          <CotacoesTab 
            cotacoes={cotacoes}
            onRefresh={loadData}
          />
        </TabsContent>
        
        <TabsContent value="internacionais">
          <CotacoesInternacionaisTab 
            cotacoes={cotacoesInternacionais}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}