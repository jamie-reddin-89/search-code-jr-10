import { useState, useEffect } from "react";
import { Lightbulb, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getAllBrands, getBrandModels, type Brand, type Device } from "@/lib/deviceManager";

const basicWizardSteps = [
  {
    question: "What type of issue are you experiencing?",
    options: [
      { value: "heating", label: "No heating" },
      { value: "cooling", label: "No cooling" },
      { value: "noise", label: "Unusual noise" },
      { value: "leak", label: "Water leak" },
      { value: "error", label: "Error code displayed" },
    ],
  },
  {
    question: "When did the problem start?",
    options: [
      { value: "sudden", label: "Suddenly/immediately" },
      { value: "gradual", label: "Gradually over time" },
      { value: "intermittent", label: "Comes and goes" },
      { value: "startup", label: "After installation/startup" },
    ],
  },
  {
    question: "Have you checked the basics?",
    options: [
      { value: "power", label: "Power supply is on" },
      { value: "thermostat", label: "Thermostat set correctly" },
      { value: "filters", label: "Filters are clean" },
      { value: "breaker", label: "Circuit breaker not tripped" },
    ],
  },
];

export const TroubleshootingWizard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Device[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBrands();
    }
  }, [isOpen]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const allBrands = await getAllBrands();
      setBrands(allBrands);
    } catch (err) {
      console.error("Error loading brands:", err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleBrandChange = async (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedModel("");
    setModels([]);
    if (brandId) {
      try {
        const brandModels = await getBrandModels(brandId);
        setModels(brandModels);
      } catch (err) {
        console.error("Error loading models:", err);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateDiagnosis();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const generateDiagnosis = () => {
    let result = "Based on your answers:\n\n";

    if (answers[0] === "heating") {
      result += "• Check outdoor unit for ice buildup\n";
      result += "• Verify refrigerant levels\n";
      result += "• Inspect compressor operation\n";
    } else if (answers[0] === "cooling") {
      result += "• Check air filters\n";
      result += "• Verify outdoor unit operation\n";
      result += "• Check refrigerant pressure\n";
    } else if (answers[0] === "noise") {
      result += "• Inspect fan blades for damage\n";
      result += "• Check mounting bolts\n";
      result += "• Verify compressor operation\n";
    } else if (answers[0] === "leak") {
      result += "• Inspect condensate drain\n";
      result += "• Check pipe connections\n";
      result += "• Verify pressure relief valve\n";
    }

    if (answers[1] === "sudden") {
      result += "\n• Priority: Check for electrical issues\n";
      result += "• Look for recent system changes\n";
    }

    result += "\n• Recommended: Contact certified technician if issue persists";

    setDiagnosis(result);
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setAnswers([]);
    setDiagnosis("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetWizard();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open troubleshooting wizard">
          <Lightbulb className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Troubleshooting Wizard</DialogTitle>
        </DialogHeader>

        {!diagnosis ? (
          <div className="space-y-6">
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Equipment Information (Optional)</h3>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Brand
                </Label>
                <Select value={selectedBrand} onValueChange={handleBrandChange}>
                  <SelectTrigger className="text-sm">
                    {loadingBrands ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading brands...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select brand" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBrand && models.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Model
                  </Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Step {currentStep + 1} of {basicWizardSteps.length}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">{basicWizardSteps[currentStep].question}</h3>
              <RadioGroup
                value={answers[currentStep]}
                onValueChange={handleAnswerChange}
              >
                {basicWizardSteps[currentStep].options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[currentStep]}
              >
                {currentStep === basicWizardSteps.length - 1 ? "Get Diagnosis" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recommended Actions:</h3>
              <pre className="whitespace-pre-wrap text-sm">{diagnosis}</pre>
            </Card>
            <Button onClick={resetWizard} className="w-full">
              Start New Diagnosis
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
