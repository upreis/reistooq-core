import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OMSSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do OMS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurações em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}