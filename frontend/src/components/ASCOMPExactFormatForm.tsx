import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Save, Send, Download } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface ChecklistItem {
  status: string;
  yesNoOk: string;
}

interface ASCOMPFormData {
  // Header
  date: string;
  cinemaName: string;
  address: string;
  contactDetails: string;
  location: string;
  
  // Serial Info
  serialNumber: string;
  equipAndEWServiceVisit: string;
  projectorModelSerialAndHours: string;
  replacementRequired: boolean;
  
  // Page 1: Checklist sections
  opticals: {
    reflector: ChecklistItem;
    uvFilter: ChecklistItem;
    integratorRod: ChecklistItem;
    coldMirror: ChecklistItem;
    foldMirror: ChecklistItem;
  };
  electronics: {
    touchPanel: ChecklistItem;
    evbAndImcbBoard: ChecklistItem;
    pibAndIcpBoard: ChecklistItem;
    imb2Board: ChecklistItem;
  };
  serialNumberVerified: {
    chassisLabelVsTouchPanel: ChecklistItem;
  };
  disposableConsumables: {
    airIntakeLadAndRad: ChecklistItem;
  };
  coolant: {
    levelAndColor: ChecklistItem;
    white: ChecklistItem;
    red: ChecklistItem;
  };
  lightEngineTestPattern: {
    green: ChecklistItem;
    blue: ChecklistItem;
    black: ChecklistItem;
  };
  mechanical: {
    acBlowerAndVaneSwitch: ChecklistItem;
    extractorVaneSwitch: ChecklistItem;
    exhaustCfmValue: ChecklistItem;
    lightEngineFansWithLadFan: ChecklistItem;
    cardCageTopAndBottomFans: ChecklistItem;
    radiatorFanAndPump: ChecklistItem;
    connectorAndHoseForPump: ChecklistItem;
    securityAndLampHouseLockSwitch: ChecklistItem;
  };
  lampLocMechanism: {
    xAndZMovement: ChecklistItem;
  };
  
  // Page 2 fields
  projectorPlacementRoomAndEnvironment: string;
  lampInfo: {
    makeAndModel: string;
    numberOfLampsRunning: number | '';
    currentLampRunningHours: number | '';
  };
  voltageParameters: {
    pVsN: string;
    pVsE: string;
    nVsE: string;
  };
  flMeasurements: string;
  contentPlayerModel: string;
  acStatus: string;
  leStatusDuringPM: string;
  remarks: string;
  leSNo: string;
  
  softwareVersion: {
    w2k4k: { mcgd: string; fl: string; x: string; y: string };
    r2k4k: { mcgd: string; fl: string; x: string; y: string };
    g2k4k: { mcgd: string; fl: string; x: string; y: string };
  };
  
  screenInformation: {
    scope: { height: string; width: string; gain: string };
    flat: { height: string; width: string; gain: string };
    screenMake: string;
    throwDistance: string;
  };
  
  imageEvaluation: {
    focusBoresight: string;
    integratorPosition: string;
    spotOnScreenAfterIPM: string;
    croppingScreenEdges6x31AndScope: string;
    convergenceChecked: string;
    channelsCheckedScopeFlatAlternative: string;
    pixelDefects: string;
    excessiveImageVibration: string;
    liteLoc: string;
  };
  
  cieXyzColorAccuracy: {
    bwStep: { x: string; y: string; fl: string };
    _10_2k4k: { x: string; y: string; fl: string };
  };
  
  airPollutionLevel: {
    hcho: string;
    tvoc: string;
    pm10: string;
    pm25: string;
    pm10_full: string;
    temperature: string;
    humidityPercent: string;
  };
  
  engineer: {
    name: string;
    phone: string;
    email: string;
  };
}

interface Props {
  onSubmit: (data: ASCOMPFormData) => void;
  onClose: () => void;
  initialData?: Partial<ASCOMPFormData>;
}

export function ASCOMPExactFormatForm({ onSubmit, onClose, initialData }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const clientSignatureRef = useRef<SignatureCanvas>(null);
  const engineerSignatureRef = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState<ASCOMPFormData>({
    // Header
    date: new Date().toISOString().split('T')[0],
    cinemaName: '',
    address: '',
    contactDetails: '',
    location: '',
    
    // Serial Info
    serialNumber: '',
    equipAndEWServiceVisit: '',
    projectorModelSerialAndHours: '',
    replacementRequired: false,
    
    // Opticals
    opticals: {
      reflector: { status: '', yesNoOk: '' },
      uvFilter: { status: '', yesNoOk: '' },
      integratorRod: { status: '', yesNoOk: '' },
      coldMirror: { status: '', yesNoOk: '' },
      foldMirror: { status: '', yesNoOk: '' }
    },
    
    // Electronics
    electronics: {
      touchPanel: { status: '', yesNoOk: '' },
      evbAndImcbBoard: { status: '', yesNoOk: '' },
      pibAndIcpBoard: { status: '', yesNoOk: '' },
      imb2Board: { status: '', yesNoOk: '' }
    },
    
    // Serial Number Verified
    serialNumberVerified: {
      chassisLabelVsTouchPanel: { status: '', yesNoOk: '' }
    },
    
    // Disposable Consumables
    disposableConsumables: {
      airIntakeLadAndRad: { status: '', yesNoOk: '' }
    },
    
    // Coolant
    coolant: {
      levelAndColor: { status: '', yesNoOk: '' },
      white: { status: '', yesNoOk: '' },
      red: { status: '', yesNoOk: '' }
    },
    
    // Light Engine Test Pattern
    lightEngineTestPattern: {
      green: { status: '', yesNoOk: '' },
      blue: { status: '', yesNoOk: '' },
      black: { status: '', yesNoOk: '' }
    },
    
    // Mechanical
    mechanical: {
      acBlowerAndVaneSwitch: { status: '', yesNoOk: '' },
      extractorVaneSwitch: { status: '', yesNoOk: '' },
      exhaustCfmValue: { status: '', yesNoOk: '' },
      lightEngineFansWithLadFan: { status: '', yesNoOk: '' },
      cardCageTopAndBottomFans: { status: '', yesNoOk: '' },
      radiatorFanAndPump: { status: '', yesNoOk: '' },
      connectorAndHoseForPump: { status: '', yesNoOk: '' },
      securityAndLampHouseLockSwitch: { status: '', yesNoOk: '' }
    },
    
    // Lamp LOC Mechanism
    lampLocMechanism: {
      xAndZMovement: { status: '', yesNoOk: '' }
    },
    
    // Page 2 fields
    projectorPlacementRoomAndEnvironment: '',
    lampInfo: {
      makeAndModel: '',
      numberOfLampsRunning: '',
      currentLampRunningHours: ''
    },
    voltageParameters: {
      pVsN: '',
      pVsE: '',
      nVsE: ''
    },
    flMeasurements: '',
    contentPlayerModel: '',
    acStatus: '',
    leStatusDuringPM: '',
    remarks: '',
    leSNo: '',
    
    softwareVersion: {
      w2k4k: { mcgd: '', fl: '', x: '', y: '' },
      r2k4k: { mcgd: '', fl: '', x: '', y: '' },
      g2k4k: { mcgd: '', fl: '', x: '', y: '' }
    },
    
    screenInformation: {
      scope: { height: '', width: '', gain: '' },
      flat: { height: '', width: '', gain: '' },
      screenMake: '',
      throwDistance: ''
    },
    
    imageEvaluation: {
      focusBoresight: '',
      integratorPosition: '',
      spotOnScreenAfterIPM: '',
      croppingScreenEdges6x31AndScope: '',
      convergenceChecked: '',
      channelsCheckedScopeFlatAlternative: '',
      pixelDefects: '',
      excessiveImageVibration: '',
      liteLoc: ''
    },
    
    cieXyzColorAccuracy: {
      bwStep: { x: '', y: '', fl: '' },
      _10_2k4k: { x: '', y: '', fl: '' }
    },
    
    airPollutionLevel: {
      hcho: '',
      tvoc: '',
      pm10: '',
      pm25: '',
      pm10_full: '',
      temperature: '',
      humidityPercent: ''
    },
    
    engineer: {
      name: '',
      phone: '',
      email: ''
    },
    
    ...initialData
  });

  const updateChecklistItem = (section: string, field: string, column: 'status' | 'yesNoOk', value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ASCOMPFormData],
        [field]: {
          ...(prev[section as keyof ASCOMPFormData] as any)[field],
          [column]: value
        }
      }
    }));
  };

  const handleSubmit = () => {
    // Get signatures
    const clientSignature = clientSignatureRef.current?.toDataURL();
    const engineerSignature = engineerSignatureRef.current?.toDataURL();
    
    const completeData = {
      ...formData,
      clientSignatureAndStamp: {
        signatureData: clientSignature || ''
      },
      engineerSignature: {
        signatureData: engineerSignature || '',
        name: formData.engineer.name
      }
    };
    
    onSubmit(completeData as any);
  };

  const renderChecklistRow = (
    section: string,
    field: string,
    description: string
  ) => (
    <tr className="border-b border-gray-200">
      <td className="p-2 text-sm">{description}</td>
      <td className="p-2">
        <Input
          value={(formData[section as keyof ASCOMPFormData] as any)?.[field]?.status || ''}
          onChange={(e) => updateChecklistItem(section, field, 'status', e.target.value)}
          className="h-8"
          placeholder="Status"
        />
      </td>
      <td className="p-2">
        <select
          value={(formData[section as keyof ASCOMPFormData] as any)?.[field]?.yesNoOk || ''}
          onChange={(e) => updateChecklistItem(section, field, 'yesNoOk', e.target.value)}
          className="w-full h-8 px-2 border rounded"
        >
          <option value="">-</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
          <option value="OK">OK</option>
          <option value="N/A">N/A</option>
        </select>
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">ASCOMP Inc. - EW Preventive Maintenance Report</h2>
              <p className="text-blue-100 text-sm mt-1">
                Complete all sections accurately - Page {currentPage} of 2
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Page Navigation */}
          <div className="mb-6 flex gap-2">
            <Button
              onClick={() => setCurrentPage(1)}
              variant={currentPage === 1 ? 'default' : 'outline'}
            >
              Page 1: Checklist
            </Button>
            <Button
              onClick={() => setCurrentPage(2)}
              variant={currentPage === 2 ? 'default' : 'outline'}
            >
              Page 2: Details & Measurements
            </Button>
          </div>

          {/* PAGE 1: CHECKLIST */}
          {currentPage === 1 && (
            <div className="space-y-6">
              {/* Header Information */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Cinema Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CINEMA NAME *</Label>
                      <Input
                        value={formData.cinemaName}
                        onChange={(e) => setFormData({...formData, cinemaName: e.target.value})}
                        placeholder="Enter cinema name"
                        required
                      />
                    </div>
                    <div>
                      <Label>DATE *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Full address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Details</Label>
                      <Input
                        value={formData.contactDetails}
                        onChange={(e) => setFormData({...formData, contactDetails: e.target.value})}
                        placeholder="Phone, email, etc."
                      />
                    </div>
                    <div>
                      <Label>LOCATION</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Location"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Serial Information */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Serial & Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SERIAL #</Label>
                      <Input
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Equip and EW Service visit</Label>
                      <Input
                        value={formData.equipAndEWServiceVisit}
                        onChange={(e) => setFormData({...formData, equipAndEWServiceVisit: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Projector Model, Serial No. and Running Hours</Label>
                      <Input
                        value={formData.projectorModelSerialAndHours}
                        onChange={(e) => setFormData({...formData, projectorModelSerialAndHours: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        id="replacementRequired"
                        checked={formData.replacementRequired}
                        onChange={(e) => setFormData({...formData, replacementRequired: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="replacementRequired">Replacement Required</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Checklist Table */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Service Checklist</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left font-semibold">DESCRIPTION</th>
                          <th className="p-3 text-left font-semibold w-32">STATUS</th>
                          <th className="p-3 text-left font-semibold w-32">YES/NO-OK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* OPTICALS Section */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">OPTICALS</td>
                        </tr>
                        {renderChecklistRow('opticals', 'reflector', 'Reflector')}
                        {renderChecklistRow('opticals', 'uvFilter', 'UV filter')}
                        {renderChecklistRow('opticals', 'integratorRod', 'Integrator Rod')}
                        {renderChecklistRow('opticals', 'coldMirror', 'Cold Mirror')}
                        {renderChecklistRow('opticals', 'foldMirror', 'Fold Mirror')}
                        
                        {/* ELECTRONICS Section */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">ELECTRONICS</td>
                        </tr>
                        {renderChecklistRow('electronics', 'touchPanel', 'Touch Panel')}
                        {renderChecklistRow('electronics', 'evbAndImcbBoard', 'EVB and IMCB Board')}
                        {renderChecklistRow('electronics', 'pibAndIcpBoard', 'PIB and ICP Board')}
                        {renderChecklistRow('electronics', 'imb2Board', 'IMB-2 Board')}
                        
                        {/* Serial Number Verified */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">Serial Number verified</td>
                        </tr>
                        {renderChecklistRow('serialNumberVerified', 'chassisLabelVsTouchPanel', 'Chassis label vs Touch Panel')}
                        
                        {/* Disposable Consumables */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">Disposable Consumables</td>
                        </tr>
                        {renderChecklistRow('disposableConsumables', 'airIntakeLadAndRad', 'Air intake, LAD and RAD')}
                        
                        {/* Coolant */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">Coolant</td>
                        </tr>
                        {renderChecklistRow('coolant', 'levelAndColor', 'Level and Color')}
                        {renderChecklistRow('coolant', 'white', 'White')}
                        {renderChecklistRow('coolant', 'red', 'Red')}
                        
                        {/* Light Engine Test Pattern */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">Light Engine Test Pattern</td>
                        </tr>
                        {renderChecklistRow('lightEngineTestPattern', 'green', 'Green')}
                        {renderChecklistRow('lightEngineTestPattern', 'blue', 'Blue')}
                        {renderChecklistRow('lightEngineTestPattern', 'black', 'Black')}
                        
                        {/* MECHANICAL */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">MECHANICAL</td>
                        </tr>
                        {renderChecklistRow('mechanical', 'acBlowerAndVaneSwitch', 'AC Blower and Vane Switch')}
                        {renderChecklistRow('mechanical', 'extractorVaneSwitch', 'Extractor Vane Switch')}
                        {renderChecklistRow('mechanical', 'exhaustCfmValue', 'Exhaust CFM - Value')}
                        {renderChecklistRow('mechanical', 'lightEngineFansWithLadFan', "Light Engine's fans with LAD fan")}
                        {renderChecklistRow('mechanical', 'cardCageTopAndBottomFans', 'Card Cage Top and Bottom fans')}
                        {renderChecklistRow('mechanical', 'radiatorFanAndPump', 'Radiator fan and Pump')}
                        {renderChecklistRow('mechanical', 'connectorAndHoseForPump', 'Connector and hose for the Pump')}
                        {renderChecklistRow('mechanical', 'securityAndLampHouseLockSwitch', 'Security and lamp house lock switch')}
                        
                        {/* Lamp LOC Mechanism */}
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="p-2 font-bold text-blue-900">Lamp LOC Mechanism X and Z movement</td>
                        </tr>
                        {renderChecklistRow('lampLocMechanism', 'xAndZMovement', '')}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE 2: DETAILED INFORMATION */}
          {currentPage === 2 && (
            <div className="space-y-6">
              {/* Projector Placement */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Projector placement, room and environment</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Input
                    value={formData.projectorPlacementRoomAndEnvironment}
                    onChange={(e) => setFormData({...formData, projectorPlacementRoomAndEnvironment: e.target.value})}
                    placeholder="Describe projector placement and environment"
                  />
                </CardContent>
              </Card>

              {/* Lamp Information & Voltage */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Lamp Information & Voltage Parameters</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Lamp Make and Model</Label>
                      <Input
                        value={formData.lampInfo.makeAndModel}
                        onChange={(e) => setFormData({...formData, lampInfo: {...formData.lampInfo, makeAndModel: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>Number of lamps running</Label>
                      <Input
                        type="number"
                        value={formData.lampInfo.numberOfLampsRunning}
                        onChange={(e) => setFormData({...formData, lampInfo: {...formData.lampInfo, numberOfLampsRunning: Number(e.target.value)}})}
                      />
                    </div>
                    <div>
                      <Label>Current lamp running hours</Label>
                      <Input
                        type="number"
                        value={formData.lampInfo.currentLampRunningHours}
                        onChange={(e) => setFormData({...formData, lampInfo: {...formData.lampInfo, currentLampRunningHours: Number(e.target.value)}})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>P vs N</Label>
                      <Input
                        value={formData.voltageParameters.pVsN}
                        onChange={(e) => setFormData({...formData, voltageParameters: {...formData.voltageParameters, pVsN: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>P vs E</Label>
                      <Input
                        value={formData.voltageParameters.pVsE}
                        onChange={(e) => setFormData({...formData, voltageParameters: {...formData.voltageParameters, pVsE: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>N vs E</Label>
                      <Input
                        value={formData.voltageParameters.nVsE}
                        onChange={(e) => setFormData({...formData, voltageParameters: {...formData.voltageParameters, nVsE: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>fL measurements</Label>
                      <Input
                        value={formData.flMeasurements}
                        onChange={(e) => setFormData({...formData, flMeasurements: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Content Player Model</Label>
                      <Input
                        value={formData.contentPlayerModel}
                        onChange={(e) => setFormData({...formData, contentPlayerModel: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>AC Status</Label>
                      <select
                        value={formData.acStatus}
                        onChange={(e) => setFormData({...formData, acStatus: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select...</option>
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>LE Status during PM</Label>
                      <select
                        value={formData.leStatusDuringPM}
                        onChange={(e) => setFormData({...formData, leStatusDuringPM: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select...</option>
                        <option value="Removed">Removed</option>
                        <option value="Not removed - Good fL">Not removed - Good fL</option>
                        <option value="Not removed - DE bonded">Not removed - DE bonded</option>
                      </select>
                    </div>
                    <div>
                      <Label>LE S. No.</Label>
                      <Input
                        value={formData.leSNo}
                        onChange={(e) => setFormData({...formData, leSNo: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Remarks</Label>
                    <Input
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      placeholder="Additional remarks..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Software Version Table */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Software Version</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Version</th>
                        <th className="p-2 border">MCGD</th>
                        <th className="p-2 border">fL</th>
                        <th className="p-2 border">x</th>
                        <th className="p-2 border">y</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border font-semibold">W2K/4K</td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.w2k4k.mcgd} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, w2k4k: {...formData.softwareVersion.w2k4k, mcgd: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.w2k4k.fl} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, w2k4k: {...formData.softwareVersion.w2k4k, fl: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.w2k4k.x} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, w2k4k: {...formData.softwareVersion.w2k4k, x: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.w2k4k.y} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, w2k4k: {...formData.softwareVersion.w2k4k, y: e.target.value}}})} className="h-8" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border font-semibold">R2K/4K</td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.r2k4k.mcgd} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, r2k4k: {...formData.softwareVersion.r2k4k, mcgd: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.r2k4k.fl} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, r2k4k: {...formData.softwareVersion.r2k4k, fl: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.r2k4k.x} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, r2k4k: {...formData.softwareVersion.r2k4k, x: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.r2k4k.y} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, r2k4k: {...formData.softwareVersion.r2k4k, y: e.target.value}}})} className="h-8" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border font-semibold">G2K/4K</td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.g2k4k.mcgd} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, g2k4k: {...formData.softwareVersion.g2k4k, mcgd: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.g2k4k.fl} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, g2k4k: {...formData.softwareVersion.g2k4k, fl: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.g2k4k.x} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, g2k4k: {...formData.softwareVersion.g2k4k, x: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.softwareVersion.g2k4k.y} onChange={(e) => setFormData({...formData, softwareVersion: {...formData.softwareVersion, g2k4k: {...formData.softwareVersion.g2k4k, y: e.target.value}}})} className="h-8" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Screen Information */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Screen Information (in metres)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Type</th>
                        <th className="p-2 border">Height</th>
                        <th className="p-2 border">Width</th>
                        <th className="p-2 border">Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border font-semibold">SCOPE</td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.scope.height} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, scope: {...formData.screenInformation.scope, height: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.scope.width} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, scope: {...formData.screenInformation.scope, width: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.scope.gain} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, scope: {...formData.screenInformation.scope, gain: e.target.value}}})} className="h-8" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border font-semibold">FLAT</td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.flat.height} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, flat: {...formData.screenInformation.flat, height: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.flat.width} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, flat: {...formData.screenInformation.flat, width: e.target.value}}})} className="h-8" />
                        </td>
                        <td className="p-2 border">
                          <Input value={formData.screenInformation.flat.gain} onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, flat: {...formData.screenInformation.flat, gain: e.target.value}}})} className="h-8" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Screen Make</Label>
                      <Input
                        value={formData.screenInformation.screenMake}
                        onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, screenMake: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>Throw Distance</Label>
                      <Input
                        value={formData.screenInformation.throwDistance}
                        onChange={(e) => setFormData({...formData, screenInformation: {...formData.screenInformation, throwDistance: e.target.value}})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image Evaluation */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Image Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border text-left">Item</th>
                        <th className="p-2 border w-32">OK - Yes/No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'focusBoresight', label: 'Focus/boresight' },
                        { key: 'integratorPosition', label: 'Integrator Position' },
                        { key: 'spotOnScreenAfterIPM', label: 'Any Spot on the Screen after IPM' },
                        { key: 'croppingScreenEdges6x31AndScope', label: 'Cropping, Screen Edges 6X31 and SCOPE' },
                        { key: 'convergenceChecked', label: 'Convergence Checked' },
                        { key: 'channelsCheckedScopeFlatAlternative', label: 'Channels Checked - Scope, Flat, Alternative' },
                        { key: 'pixelDefects', label: 'Pixel defects' },
                        { key: 'excessiveImageVibration', label: 'Excessive image vibration' },
                        { key: 'liteLoc', label: 'LiteLOC' }
                      ].map(item => (
                        <tr key={item.key}>
                          <td className="p-2 border">{item.label}</td>
                          <td className="p-2 border">
                            <select
                              value={(formData.imageEvaluation as any)[item.key]}
                              onChange={(e) => setFormData({...formData, imageEvaluation: {...formData.imageEvaluation, [item.key]: e.target.value}})}
                              className="w-full px-2 py-1 border rounded"
                            >
                              <option value="">-</option>
                              <option value="OK">OK</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* CIE XYZ Color Accuracy & Air Pollution */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-sm">CIE XYZ Color Accuracy Test Pattern</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <table className="w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 border">Pattern</th>
                          <th className="p-2 border">x</th>
                          <th className="p-2 border">y</th>
                          <th className="p-2 border">fL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-semibold">BW Step-</td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy.bwStep.x} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, bwStep: {...formData.cieXyzColorAccuracy.bwStep, x: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy.bwStep.y} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, bwStep: {...formData.cieXyzColorAccuracy.bwStep, y: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy.bwStep.fl} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, bwStep: {...formData.cieXyzColorAccuracy.bwStep, fl: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-semibold">10 2K/4K</td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy._10_2k4k.x} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, _10_2k4k: {...formData.cieXyzColorAccuracy._10_2k4k, x: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy._10_2k4k.y} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, _10_2k4k: {...formData.cieXyzColorAccuracy._10_2k4k, y: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                          <td className="p-2 border">
                            <Input value={formData.cieXyzColorAccuracy._10_2k4k.fl} onChange={(e) => setFormData({...formData, cieXyzColorAccuracy: {...formData.cieXyzColorAccuracy, _10_2k4k: {...formData.cieXyzColorAccuracy._10_2k4k, fl: e.target.value}}})} className="h-7 text-sm" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-sm">Air Pollution Level</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs">HCHO</Label>
                        <Input value={formData.airPollutionLevel.hcho} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, hcho: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">TVOC</Label>
                        <Input value={formData.airPollutionLevel.tvoc} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, tvoc: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">PM1.0</Label>
                        <Input value={formData.airPollutionLevel.pm10} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, pm10: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">PM2.5</Label>
                        <Input value={formData.airPollutionLevel.pm25} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, pm25: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">PM10</Label>
                        <Input value={formData.airPollutionLevel.pm10_full} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, pm10_full: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Temperature</Label>
                        <Input value={formData.airPollutionLevel.temperature} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, temperature: e.target.value}})} className="h-7 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Humidity %</Label>
                        <Input value={formData.airPollutionLevel.humidityPercent} onChange={(e) => setFormData({...formData, airPollutionLevel: {...formData.airPollutionLevel, humidityPercent: e.target.value}})} className="h-7 text-sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engineer Information */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">Engineer Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Engineer Name *</Label>
                      <Input
                        value={formData.engineer.name}
                        onChange={(e) => setFormData({...formData, engineer: {...formData.engineer, name: e.target.value}})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.engineer.phone}
                        onChange={(e) => setFormData({...formData, engineer: {...formData.engineer, phone: e.target.value}})}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.engineer.email}
                        onChange={(e) => setFormData({...formData, engineer: {...formData.engineer, email: e.target.value}})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg">Client's Signature & Stamp</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="border-2 border-dashed border-gray-300 rounded">
                      <SignatureCanvas
                        ref={clientSignatureRef}
                        canvasProps={{
                          width: 400,
                          height: 150,
                          className: 'signature-canvas w-full'
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clientSignatureRef.current?.clear()}
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg">Engineer's Signature</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="border-2 border-dashed border-gray-300 rounded">
                      <SignatureCanvas
                        ref={engineerSignatureRef}
                        canvasProps={{
                          width: 400,
                          height: 150,
                          className: 'signature-canvas w-full'
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => engineerSignatureRef.current?.clear()}
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex items-center justify-between">
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous Page
              </Button>
            )}
            {currentPage < 2 && (
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next Page
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Save as draft
                handleSubmit();
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}







