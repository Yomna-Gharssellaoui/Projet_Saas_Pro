import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Zap,
} from "lucide-react";
import { AiApi, type AiRiskResponse, type RiskLevel } from "@/shared/lib/services/ai";
import { toast } from "sonner";

interface AiRiskCardProps {
  clientId: string;
  className?: string;
}

export function AiRiskCard({ clientId, className = "" }: AiRiskCardProps) {
  const [risk, setRisk] = useState<AiRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRisk = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await AiApi.getRisk(clientId);
        setRisk(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load risk assessment");
        toast.error("Error", {
          description: "Could not fetch AI risk assessment",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRisk();
  }, [clientId]);

  const getRiskConfig = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return {
          color: "bg-red-50",
          borderColor: "border-red-200",
          badgeColor: "border-red-200 bg-red-50 text-red-700",
          icon: AlertTriangle,
          bgGradient: "from-red-50 to-red-25",
        };
      case "MEDIUM":
        return {
          color: "bg-yellow-50",
          borderColor: "border-yellow-200",
          badgeColor: "border-yellow-200 bg-yellow-50 text-yellow-700",
          icon: AlertCircle,
          bgGradient: "from-yellow-50 to-yellow-25",
        };
      case "LOW":
        return {
          color: "bg-green-50",
          borderColor: "border-green-200",
          badgeColor: "border-green-200 bg-green-50 text-green-700",
          icon: CheckCircle2,
          bgGradient: "from-green-50 to-green-25",
        };
    }
  };

  const config = risk ? getRiskConfig(risk.risk) : getRiskConfig("LOW");
  const IconComponent = config.icon;

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="flex items-center gap-3 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-3 p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analyzing client risk...</p>
        </CardContent>
      </Card>
    );
  }

  if (!risk) {
    return null;
  }

  const scorePercentage = Math.round(risk.score * 100);
  const scoreWidth = `${scorePercentage}%`;

  return (
    <Card className={`border-2 ${config.borderColor} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${config.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Risk Assessment</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Machine learning based analysis</p>
            </div>
          </div>
          <Badge className={config.badgeColor}>{risk.risk}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Risk Score Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Risk Score</span>
            <span className="text-lg font-bold text-foreground">{scorePercentage}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                risk.risk === "HIGH"
                  ? "bg-red-500"
                  : risk.risk === "MEDIUM"
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: scoreWidth }}
            />
          </div>
        </div>

        {/* Reason/Explanation */}
        <Alert className={`${config.borderColor} ${config.color}`}>
          <Zap className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {risk.reason}
          </AlertDescription>
        </Alert>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground font-medium">Total Invoices</p>
            <p className="text-xl font-bold text-foreground">{risk.details.totalInvoices}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground font-medium">Unpaid</p>
            <p className="text-xl font-bold text-red-600">{risk.details.unpaidInvoices}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground font-medium">Overdue</p>
            <p className="text-xl font-bold text-orange-600">{risk.details.lateInvoices}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
            <p className="text-lg font-bold text-foreground">
              {risk.details.outstanding.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Outstanding Balance</span>
            <span className="font-semibold text-foreground">
              {risk.details.outstanding.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Revenue</span>
            <span className="font-semibold text-foreground">
              {risk.details.revenue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Status</span>
            <span
              className={`font-semibold ${
                risk.risk === "HIGH"
                  ? "text-red-600"
                  : risk.risk === "MEDIUM"
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {risk.risk === "LOW" ? "✓ Healthy" : risk.risk === "MEDIUM" ? "⚠ Caution" : "✕ At Risk"}
            </span>
          </div>
        </div>

        {/* Info Footer */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Powered by TensorFlow AI model · Analysis based on invoice history
        </p>
      </CardContent>
    </Card>
  );
}
