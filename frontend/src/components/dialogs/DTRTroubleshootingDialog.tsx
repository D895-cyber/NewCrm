import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Plus, Wrench, CheckCircle, AlertCircle } from "lucide-react";
import { apiClient } from "../../utils/api/client";

interface TroubleshootingStep {
  step: number;
  description: string;
  outcome: string;
  performedBy: string;
  performedAt: string;
  attachments?: string[];
}

interface DTRTroubleshootingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dtrId: string;
  dtrCaseId: string;
  existingSteps?: TroubleshootingStep[];
  onStepAdded: () => void;
}

export function DTRTroubleshootingDialog({
  open,
  onOpenChange,
  dtrId,
  dtrCaseId,
  existingSteps = [],
  onStepAdded
}: DTRTroubleshootingDialogProps) {
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim() || !outcome.trim()) {
      setError("Description and outcome are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/dtr/${dtrId}/troubleshooting`, {
        description,
        outcome,
        attachments: []
      });

      setSuccess("Troubleshooting step added successfully");
      setDescription("");
      setOutcome("");
      onStepAdded();
      
      // Close dialog after 1 second
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add troubleshooting step");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Troubleshooting Steps - {dtrCaseId}
          </DialogTitle>
          <DialogDescription>
            Document your troubleshooting actions and outcomes
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        )}

        {/* Existing Steps */}
        {existingSteps.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Previous Steps:</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {existingSteps.map((step) => (
                <div key={step.step} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900">{step.description}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Outcome:</span> {step.outcome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {step.performedBy} • {new Date(step.performedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Step Form */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm text-gray-700">Add New Step:</h3>
          
          <div className="space-y-2">
            <Label>Action Description *</Label>
            <Textarea
              placeholder="Describe what troubleshooting action you performed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Example: "Tested HDMI cable connection and replaced with known working cable"
            </p>
          </div>

          <div className="space-y-2">
            <Label>Outcome *</Label>
            <Textarea
              placeholder="Describe the outcome of this action..."
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Example: "Issue persists. Signal still not detected on display."
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim() || !outcome.trim()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add Troubleshooting Step"}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={isSubmitting}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}










