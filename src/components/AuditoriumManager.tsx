import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Projector } from 'lucide-react';
// Toast notifications will use the global showToast function

interface Auditorium {
  _id?: string;
  audiNumber: string;
  name: string;
  capacity: number;
  screenSize: string;
  projectorCount: number;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  notes: string;
  projectors?: Projector[];
}

interface Projector {
  _id: string;
  projectorNumber: string;
  serialNumber: string;
  model: string;
  brand: string;
  status: string;
  condition: string;
  lastService?: Date;
  nextService?: Date;
}

interface AuditoriumManagerProps {
  siteId: string;
  siteName: string;
  auditoriums: Auditorium[];
  onAuditoriumUpdate: (auditoriums: Auditorium[]) => void;
  onProjectorAdd?: (auditoriumId: string, projector: Projector) => void;
}

const AuditoriumManager: React.FC<AuditoriumManagerProps> = ({
  siteId,
  siteName,
  auditoriums,
  onAuditoriumUpdate,
  onProjectorAdd
}) => {
  const [isAddingAuditorium, setIsAddingAuditorium] = useState(false);
  const [editingAuditorium, setEditingAuditorium] = useState<string | null>(null);
  const [newAuditorium, setNewAuditorium] = useState<Partial<Auditorium>>({
    name: '',
    capacity: 100,
    screenSize: 'Standard',
    status: 'Active',
    notes: ''
  });

  const screenSizes = ['Standard', 'Large', 'IMAX', '4K', '8K', 'Custom'];

  const handleAddAuditorium = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/auditoriums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAuditorium)
      });

      if (response.ok) {
        const result = await response.json();
        const updatedAuditoriums = [...auditoriums, result.auditorium];
        onAuditoriumUpdate(updatedAuditoriums);
        setNewAuditorium({
          name: '',
          capacity: 100,
          screenSize: 'Standard',
          status: 'Active',
          notes: ''
        });
        setIsAddingAuditorium(false);
        (window as any).showToast?.({
          type: "success",
          title: "Success",
          message: "Auditorium added successfully",
        });
      } else {
        const error = await response.json();
        (window as any).showToast?.({
          type: "error",
          title: "Error",
          message: error.message || "Failed to add auditorium",
        });
      }
    } catch (error) {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to add auditorium",
      });
    }
  };

  const handleUpdateAuditorium = async (audiNumber: string, updatedData: Partial<Auditorium>) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/auditoriums/${audiNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const result = await response.json();
        const updatedAuditoriums = auditoriums.map(audi => 
          audi.audiNumber === audiNumber ? { ...audi, ...result.auditorium } : audi
        );
        onAuditoriumUpdate(updatedAuditoriums);
        setEditingAuditorium(null);
        (window as any).showToast?.({
          type: "success",
          title: "Success",
          message: "Auditorium updated successfully",
        });
      } else {
        const error = await response.json();
        (window as any).showToast?.({
          type: "error",
          title: "Error",
          message: error.message || "Failed to update auditorium",
        });
      }
    } catch (error) {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to update auditorium",
      });
    }
  };

  const handleDeleteAuditorium = async (audiNumber: string) => {
    if (!confirm('Are you sure you want to delete this auditorium? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sites/${siteId}/auditoriums/${audiNumber}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const updatedAuditoriums = auditoriums.filter(audi => audi.audiNumber !== audiNumber);
        onAuditoriumUpdate(updatedAuditoriums);
        (window as any).showToast?.({
          type: "success",
          title: "Success",
          message: "Auditorium deleted successfully",
        });
      } else {
        const error = await response.json();
        (window as any).showToast?.({
          type: "error",
          title: "Error",
          message: error.message || "Failed to delete auditorium",
        });
      }
    } catch (error) {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to delete auditorium",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Auditoriums</h3>
        <Button 
          onClick={() => setIsAddingAuditorium(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Auditorium
        </Button>
      </div>

      {/* Add New Auditorium Form */}
      {isAddingAuditorium && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Auditorium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newAuditorium.name}
                  onChange={(e) => setNewAuditorium({ ...newAuditorium, name: e.target.value })}
                  placeholder="e.g., Main Auditorium"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={newAuditorium.capacity}
                  onChange={(e) => setNewAuditorium({ ...newAuditorium, capacity: parseInt(e.target.value) })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Screen Size</label>
                <Select
                  value={newAuditorium.screenSize}
                  onValueChange={(value) => setNewAuditorium({ ...newAuditorium, screenSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {screenSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newAuditorium.status}
                  onValueChange={(value: 'Active' | 'Inactive' | 'Under Maintenance') => 
                    setNewAuditorium({ ...newAuditorium, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newAuditorium.notes}
                onChange={(e) => setNewAuditorium({ ...newAuditorium, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddAuditorium}>Add Auditorium</Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingAuditorium(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auditoriums List */}
      <div className="grid gap-4">
        {auditoriums.map((auditorium) => (
          <Card key={auditorium.audiNumber}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Projector className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{auditorium.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{auditorium.audiNumber}</span>
                      <span>•</span>
                      <span>{auditorium.capacity} seats</span>
                      <span>•</span>
                      <span>{auditorium.screenSize}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(auditorium.status)}>
                    {auditorium.status}
                  </Badge>
                  <Badge variant="secondary">
                    {auditorium.projectorCount} Projectors
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAuditorium(editingAuditorium === auditorium.audiNumber ? null : auditorium.audiNumber)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAuditorium(auditorium.audiNumber)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Edit Auditorium Form */}
            {editingAuditorium === auditorium.audiNumber && (
              <CardContent className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={auditorium.name}
                      onChange={(e) => handleUpdateAuditorium(auditorium.audiNumber, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    <Input
                      type="number"
                      value={auditorium.capacity}
                      onChange={(e) => handleUpdateAuditorium(auditorium.audiNumber, { capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Screen Size</label>
                    <Select
                      value={auditorium.screenSize}
                      onValueChange={(value) => handleUpdateAuditorium(auditorium.audiNumber, { screenSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {screenSizes.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={auditorium.status}
                      onValueChange={(value: 'Active' | 'Inactive' | 'Under Maintenance') => 
                        handleUpdateAuditorium(auditorium.audiNumber, { status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={auditorium.notes}
                    onChange={(e) => handleUpdateAuditorium(auditorium.audiNumber, { notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setEditingAuditorium(null)}>Save Changes</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingAuditorium(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}

            {/* Projectors List */}
            {auditorium.projectors && auditorium.projectors.length > 0 && (
              <CardContent className="border-t pt-4">
                <h4 className="font-medium mb-3">Projectors in this Auditorium</h4>
                <div className="grid gap-2">
                  {auditorium.projectors.map((projector) => (
                    <div key={projector._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-gray-200 rounded">
                          <Projector className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{projector.projectorNumber}</div>
                          <div className="text-sm text-gray-600">
                            {projector.brand} {projector.model} • {projector.serialNumber}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{projector.status}</Badge>
                        <Badge variant="outline">{projector.condition}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            {/* Add Projector Button */}
            <CardContent className="border-t pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onProjectorAdd?.(auditorium.audiNumber, {} as Projector)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Projector to {auditorium.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {auditoriums.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Projector className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Auditoriums Yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first auditorium to this site.
            </p>
            <Button onClick={() => setIsAddingAuditorium(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Auditorium
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditoriumManager;
