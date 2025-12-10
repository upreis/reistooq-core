import { Package, AlertTriangle, RotateCcw, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickActions = [
  {
    icon: Package,
    label: "Pedidos",
    route: "/pedidos",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: AlertTriangle,
    label: "Reclamações",
    route: "/reclamacoes",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: RotateCcw,
    label: "Devoluções",
    route: "/devolucoesdevenda",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: TrendingUp,
    label: "Vendas",
    route: "/vendas-online",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export function QuickActionCards() {
  const navigate = useNavigate();

  return (
    <div className="md:col-span-1 grid grid-cols-2 gap-2">
      {quickActions.map((action) => (
        <button
          key={action.route}
          onClick={() => navigate(action.route)}
          className="flex flex-col items-center justify-center gap-2 p-3 bg-background border border-border rounded-2xl hover:bg-accent/50 transition-all hover:scale-105 active:scale-95"
        >
          <div className={`p-2 rounded-xl ${action.bgColor}`}>
            <action.icon className={`h-5 w-5 ${action.color}`} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
