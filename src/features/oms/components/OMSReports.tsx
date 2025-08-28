import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OMSReports() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Avançados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sistema de relatórios em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}