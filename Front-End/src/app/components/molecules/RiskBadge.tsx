import { useState, useEffect } from "react";
import { Badge } from "@/app/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AiApi, type RiskLevel } from "@/shared/lib/services/ai";

interface RiskBadgeProps {
  clientId: string;
  className?: string;
}

export function RiskBadge({ clientId, className = "" }: RiskBadgeProps) {
  const [risk, setRisk] = useState<RiskLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRisk = async () => {
      try {
        setLoading(true);
        const data = await AiApi.getRisk(clientId);
        setRisk(data.risk);
      } catch {
        setRisk(null);
      } finally {
        setLoading(false);
      }
    };

    loadRisk();
  }, [clientId]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Analyzing...</span>
      </div>
    );
  }

  if (!risk) {
    return null;
  }

  const getRiskConfig = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return {
          icon: AlertTriangle,
          badgeClass:
            "rounded-full border-red-200 bg-red-50 px-3 py-1 text-red-700",
          label: "High Risk",
        };
      case "MEDIUM":
        return {
          icon: AlertCircle,
          badgeClass:
            "rounded-full border-yellow-200 bg-yellow-50 px-3 py-1 text-yellow-700",
          label: "Medium Risk",
        };
      case "LOW":
        return {
          icon: CheckCircle2,
          badgeClass:
            "rounded-full border-green-200 bg-green-50 px-3 py-1 text-green-700",
          label: "Low Risk",
        };
    }
  };

  const config = getRiskConfig(risk);
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={`${config.badgeClass} ${className}`}>
      <IconComponent className="mr-1.5 h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
