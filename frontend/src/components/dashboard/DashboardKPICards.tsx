import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  FileText, 
  Activity, 
  Truck, 
  Package, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";

interface KPIData {
  value: number;
  change: number;
  period: string;
}

interface DashboardKPIsProps {
  kpis: {
    totalRMAs?: KPIData;
    activeRMAs?: KPIData;
    rmasInTransit?: KPIData;
    awaitingParts?: KPIData;
    completedThisMonth?: KPIData;
  };
  loading?: boolean;
}

export function DashboardKPICards({ kpis, loading = false }: DashboardKPIsProps) {
  const cards = [
    {
      title: "Total RMAs",
      value: kpis.totalRMAs?.value || 0,
      change: kpis.totalRMAs?.change || 0,
      period: kpis.totalRMAs?.period || "vs last month",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active RMAs",
      value: kpis.activeRMAs?.value || 0,
      change: kpis.activeRMAs?.change || 0,
      period: kpis.activeRMAs?.period || "this week",
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "RMAs in Transit",
      value: kpis.rmasInTransit?.value || 0,
      change: kpis.rmasInTransit?.change || 0,
      period: kpis.rmasInTransit?.period || "this week",
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Awaiting Parts",
      value: kpis.awaitingParts?.value || 0,
      change: kpis.awaitingParts?.change || 0,
      period: kpis.awaitingParts?.period || "this week",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      title: "Completed This Month",
      value: kpis.completedThisMonth?.value || 0,
      change: kpis.completedThisMonth?.change || 0,
      period: kpis.completedThisMonth?.period || "vs last month",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card 
            key={index} 
            className={`hover:shadow-lg transition-shadow border-l-4 ${card.borderColor}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  {card.change !== 0 && (
                    <>
                      {card.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={card.change > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(card.change)}%
                      </span>
                    </>
                  )}
                  <span className="text-gray-500">
                    {card.period}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

