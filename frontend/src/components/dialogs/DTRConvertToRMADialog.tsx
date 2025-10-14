import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "../../utils/api/client";

interface RMAManager {
  userId: string;
  username: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface DTRConvertToRMADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dtrId: string;
  dtrCaseId: string;
  conversionReason?: string;
  troubleshootingSteps?: number;
  onConverted: () => void;
}

export function DTRConvertToRMADialog({
  open,
  onOpenChange,
  dtrId,
  dtrCaseId,
  conversionReason = "",
  troubleshootingSteps = 0,
  onConverted
}: DTRConvertToRMADialogProps) {
  const [reason, setReason] = useState(conversionReason);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedRMAManager, setSelectedRMAManager] = useState("");
  const [rmaManagers, setRMAManagers] = useState<RMAManager[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadRMAManagers();
    }
  }, [open]);

  const loadRMAManagers = async () => {
    setIsLoadingManagers(true);
    try {
      const managers = await apiClient.get('/dtr/users/rma-managers');
      setRMAManagers(managers);
    } catch (err: any) {
      console.error("Error loading RMA managers:", err);
      // Continue without managers
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleConvert = async () => {
    if (!reason.trim()) {
      setError("Conversion reason is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedManager = rmaManagers.find(m => m.userId === selectedRMAManager);
      
      const response = await apiClient.post(`/dtr/${dtrId}/convert-to-rma`, {
        rmaManagerId: selectedRMAManager || undefined,
        rmaManagerName: selectedManager?.username || selectedManager?.profile?.firstName || undefined,
        rmaManagerEmail: selectedManager?.email || undefined,
        additionalNotes
      });

      setSuccess(`DTR successfully converted to RMA: ${response.rma?.rmaNumber || 'RMA-XXXXX'}`);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onConverted();
        onOpenChange(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to convert DTR to RMA");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkForConversion = async () => {
    if (!reason.trim()) {
      setError("Conversion reason is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/dtr/${dtrId}/mark-for-conversion`, {
        conversionReason: reason
      });

      setSuccess("DTR marked for RMA conversion");
      
      setTimeout(() => {
        onConverted();
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark DTR for conversion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Convert DTR to RMA - {dtrCaseId}
          </DialogTitle>
          <DialogDescription>
            Convert this unresolved DTR into an RMA for hardware replacement
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
            <span className="text-green-800 text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm text-blue-900">DTR Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-700">Case ID:</span>
              <span className="ml-2 font-medium text-blue-900">{dtrCaseId}</span>
            </div>
            <div>
              <span className="text-blue-700">Troubleshooting Steps:</span>
              <span className="ml-2 font-medium text-blue-900">{troubleshootingSteps}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conversion Reason *</Label>
            <Textarea
              placeholder="Explain why this DTR needs to be converted to RMA..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Example: "Hardware failure confirmed after exhaustive troubleshooting. Signal board replacement required."
            </p>
          </div>

          <div className="space-y-2">
            <Label>Assign to RMA Manager (Optional)</Label>
            <Select 
              value={selectedRMAManager} 
              onValueChange={setSelectedRMAManager}
              disabled={isLoadingManagers}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingManagers ? "Loading managers..." : "Select RMA Manager (Optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {rmaManagers.map((manager) => (
                  <SelectItem key={manager.userId} value={manager.userId}>
                    {manager.profile?.firstName && manager.profile?.lastName 
                      ? `${manager.profile.firstName} ${manager.profile.lastName}`
                      : manager.username} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rmaManagers.length === 0 && !isLoadingManagers && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No RMA managers found. RMA will be created without assignment.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional information for the RMA manager..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleConvert}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Convert to RMA Now
                </>
              )}
            </Button>
            <Button
              onClick={handleMarkForConversion}
              disabled={isSubmitting || !reason.trim()}
              variant="outline"
            >
              Mark for Review
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Converting to RMA will close this DTR and create a new RMA case with all troubleshooting history.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}












