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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { User, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "../../utils/api/client";

interface Technician {
  userId: string;
  username: string;
  email: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dtrId: string;
  dtrCaseId: string;
  currentAssignee?: string;
  onAssigned: () => void;
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  dtrId,
  dtrCaseId,
  currentAssignee,
  onAssigned
}: AssignTechnicianDialogProps) {
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedRole, setSelectedRole] = useState("technician");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTechnicians();
    }
  }, [open]);

  const loadTechnicians = async () => {
    setIsLoadingTechnicians(true);
    try {
      const data = await apiClient.get('/dtr/users/technicians');
      setTechnicians(data);
    } catch (err: any) {
      console.error("Error loading technicians:", err);
      setError("Failed to load technicians");
    } finally {
      setIsLoadingTechnicians(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician) {
      setError("Please select a technician");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const technician = technicians.find(t => t.userId === selectedTechnician);
      
      if (!technician) {
        throw new Error("Selected technician not found");
      }

      await apiClient.post(`/dtr/${dtrId}/assign-technician`, {
        technicianId: technician.userId,
        technicianName: technician.profile?.firstName && technician.profile?.lastName
          ? `${technician.profile.firstName} ${technician.profile.lastName}`
          : technician.username,
        technicianEmail: technician.email,
        role: selectedRole
      });

      setSuccess(`Successfully assigned to ${technician.username}`);
      
      // Close dialog after 1.5 seconds
      setTimeout(() => {
        onAssigned();
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign Technician - {dtrCaseId}
          </DialogTitle>
          <DialogDescription>
            Assign a technician to troubleshoot and resolve this DTR
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

        {currentAssignee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Currently assigned to:</span> {currentAssignee}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Technician *</Label>
            <Select 
              value={selectedTechnician} 
              onValueChange={setSelectedTechnician}
              disabled={isLoadingTechnicians}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTechnicians ? "Loading technicians..." : "Select technician"} />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.userId} value={tech.userId}>
                    <div className="flex flex-col">
                      <span>
                        {tech.profile?.firstName && tech.profile?.lastName 
                          ? `${tech.profile.firstName} ${tech.profile.lastName}`
                          : tech.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tech.email} • {tech.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {technicians.length === 0 && !isLoadingTechnicians && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No technicians found. Please create technician users first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assignment Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the appropriate role based on issue complexity
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAssign}
              disabled={isSubmitting || !selectedTechnician || technicians.length === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign Technician
                </>
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

























