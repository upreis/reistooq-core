import { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "./FileUpload";
import { DataPreview } from "./DataPreview";
import { ImportProgress } from "./ImportProgress";
import { ImportPreviewData, ImportResult } from "@/types/sku-mapping.types";

interface ImportWizardProps {
  onClose: () => void;
}

type Step = "upload" | "preview" | "importing" | "complete";

export function ImportWizard({ onClose }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const steps = [
    { id: "upload", label: "Upload do Arquivo", completed: currentStep !== "upload" },
    { id: "preview", label: "Prévia dos Dados", completed: ["importing", "complete"].includes(currentStep) },
    { id: "importing", label: "Importando", completed: currentStep === "complete" },
    { id: "complete", label: "Concluído", completed: currentStep === "complete" },
  ];

  const handleFileProcessed = (data: ImportPreviewData) => {
    setPreviewData(data);
    setCurrentStep("preview");
  };

  const handleImportStart = () => {
    setCurrentStep("importing");
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setCurrentStep("complete");
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("upload");
      setPreviewData(null);
    }
  };

  const handleRestart = () => {
    setCurrentStep("upload");
    setPreviewData(null);
    setImportResult(null);
  };

  const getStepVariant = (step: typeof steps[0]) => {
    if (step.id === currentStep) return "default";
    if (step.completed) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Importar Mapeamentos</DialogTitle>
      </DialogHeader>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <Badge variant={getStepVariant(step)} className="text-xs">
              {index + 1}. {step.label}
            </Badge>
            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === "upload" && (
          <FileUpload onFileProcessed={handleFileProcessed} />
        )}

        {currentStep === "preview" && previewData && (
          <DataPreview
            data={previewData}
            onImportStart={handleImportStart}
            onImportComplete={handleImportComplete}
          />
        )}

        {currentStep === "importing" && (
          <ImportProgress />
        )}

        {currentStep === "complete" && importResult && (
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-success">
              Importação Concluída!
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{importResult.success}</div>
                <div className="text-sm text-muted-foreground">Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{importResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Ignorados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{importResult.failed}</div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-left space-y-2">
                <div className="font-medium">Erros encontrados:</div>
                <div className="max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div>
          {currentStep === "preview" && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          {currentStep === "complete" && (
            <Button variant="outline" onClick={handleRestart}>
              Nova Importação
            </Button>
          )}
          <Button
            onClick={onClose}
            variant={currentStep === "complete" ? "default" : "outline"}
          >
            {currentStep === "complete" ? "Finalizar" : "Cancelar"}
          </Button>
        </div>
      </div>
    </div>
  );
}