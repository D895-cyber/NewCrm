import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ASCOMPReportData {
  reportNumber: string;
  date: string;
  cinemaName: string;
  address: string;
  contactDetails: string;
  location: string;
  serialNumber: string;
  equipAndEWServiceVisit: string;
  projectorModelSerialAndHours: string;
  replacementRequired: boolean;
  
  // Checklist sections
  opticals: any;
  electronics: any;
  serialNumberVerified: any;
  disposableConsumables: any;
  coolant: any;
  lightEngineTestPattern: any;
  mechanical: any;
  lampLocMechanism: any;
  
  // Page 2 data
  projectorPlacementRoomAndEnvironment: string;
  lampInfo: any;
  voltageParameters: any;
  flMeasurements: string;
  contentPlayerModel: string;
  acStatus: string;
  leStatusDuringPM: string;
  remarks: string;
  leSNo: string;
  softwareVersion: any;
  screenInformation: any;
  imageEvaluation: any;
  cieXyzColorAccuracy: any;
  airPollutionLevel: any;
  engineer: any;
  clientSignatureAndStamp?: any;
  engineerSignature?: any;
}

export async function exportASCOMPReportToPDF(reportData: ASCOMPReportData) {
  const pdf = new jsPDF('p', 'mm', 'a4') as any; // Type as 'any' to avoid TypeScript issues with autoTable
  
  console.log('✅ PDF initialized, autoTable available:', typeof autoTable);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // ==================== PAGE 1: HEADER ====================
  
  // ASCOMP Logo and Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASCOMP INC.', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 7;
  pdf.setFontSize(14);
  pdf.text('EW - Preventive Maintenance Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Address: 9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, Delhi 110064', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 4;
  pdf.text('Mobile: 8882375207  Email: bhupesh1@ascompinc.in  www.ascompinc.in', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  // ==================== CINEMA INFORMATION ====================
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  
  // Cinema Name and Date
  pdf.text('CINEMA NAME:', 12, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.cinemaName || '', 45, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE:', 140, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date(reportData.date).toLocaleDateString() || '', 155, yPosition);
  
  yPosition += 5;
  
  // Address
  pdf.setFont('helvetica', 'bold');
  pdf.text('Address:', 12, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.address || '', 30, yPosition);
  
  yPosition += 5;
  
  // Contact Details
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Details:', 12, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.contactDetails || '', 40, yPosition);
  
  yPosition += 8;
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  // ==================== SERIAL INFORMATION ====================
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('SERIAL #:', 12, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.serialNumber || '', 30, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Equip and EW Service visit:', 80, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.equipAndEWServiceVisit || '', 125, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOCATION:', 160, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.location || '', 180, yPosition);
  
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Projector Model, Serial No. and Running Hours:', 12, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.projectorModelSerialAndHours || '', 85, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Replacement Required:', 140, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.replacementRequired ? '☑' : '☐', 175, yPosition);
  
  yPosition += 8;

  // ==================== MAIN CHECKLIST TABLE ====================
  
  const checklistData = [];
  
  // OPTICALS Section
  checklistData.push([{ content: 'OPTICALS', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Reflector', reportData.opticals?.reflector?.status || '', reportData.opticals?.reflector?.yesNoOk || '']);
  checklistData.push(['UV filter', reportData.opticals?.uvFilter?.status || '', reportData.opticals?.uvFilter?.yesNoOk || '']);
  checklistData.push(['Integrator Rod', reportData.opticals?.integratorRod?.status || '', reportData.opticals?.integratorRod?.yesNoOk || '']);
  checklistData.push(['Cold Mirror', reportData.opticals?.coldMirror?.status || '', reportData.opticals?.coldMirror?.yesNoOk || '']);
  checklistData.push(['Fold Mirror', reportData.opticals?.foldMirror?.status || '', reportData.opticals?.foldMirror?.yesNoOk || '']);
  
  // ELECTRONICS Section
  checklistData.push([{ content: 'ELECTRONICS', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Touch Panel', reportData.electronics?.touchPanel?.status || '', reportData.electronics?.touchPanel?.yesNoOk || '']);
  checklistData.push(['EVB and IMCB Board', reportData.electronics?.evbAndImcbBoard?.status || '', reportData.electronics?.evbAndImcbBoard?.yesNoOk || '']);
  checklistData.push(['PIB and ICP Board', reportData.electronics?.pibAndIcpBoard?.status || '', reportData.electronics?.pibAndIcpBoard?.yesNoOk || '']);
  checklistData.push(['IMB-2 Board', reportData.electronics?.imb2Board?.status || '', reportData.electronics?.imb2Board?.yesNoOk || '']);
  
  // Serial Number Verified
  checklistData.push([{ content: 'Serial Number verified', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Chassis label vs Touch Panel', reportData.serialNumberVerified?.chassisLabelVsTouchPanel?.status || '', reportData.serialNumberVerified?.chassisLabelVsTouchPanel?.yesNoOk || '']);
  
  // Disposable Consumables
  checklistData.push([{ content: 'Disposable Consumables', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Air intake, LAD and RAD', reportData.disposableConsumables?.airIntakeLadAndRad?.status || '', reportData.disposableConsumables?.airIntakeLadAndRad?.yesNoOk || '']);
  
  // Coolant
  checklistData.push([{ content: 'Coolant', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Level and Color', reportData.coolant?.levelAndColor?.status || '', reportData.coolant?.levelAndColor?.yesNoOk || '']);
  checklistData.push(['White', reportData.coolant?.white?.status || '', reportData.coolant?.white?.yesNoOk || '']);
  checklistData.push(['Red', reportData.coolant?.red?.status || '', reportData.coolant?.red?.yesNoOk || '']);
  
  // Light Engine Test Pattern
  checklistData.push([{ content: 'Light Engine Test Pattern', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['Green', reportData.lightEngineTestPattern?.green?.status || '', reportData.lightEngineTestPattern?.green?.yesNoOk || '']);
  checklistData.push(['Blue', reportData.lightEngineTestPattern?.blue?.status || '', reportData.lightEngineTestPattern?.blue?.yesNoOk || '']);
  checklistData.push(['Black', reportData.lightEngineTestPattern?.black?.status || '', reportData.lightEngineTestPattern?.black?.yesNoOk || '']);
  
  // MECHANICAL
  checklistData.push([{ content: 'MECHANICAL', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['AC Blower and Vane Switch', reportData.mechanical?.acBlowerAndVaneSwitch?.status || '', reportData.mechanical?.acBlowerAndVaneSwitch?.yesNoOk || '']);
  checklistData.push(['Extractor Vane Switch', reportData.mechanical?.extractorVaneSwitch?.status || '', reportData.mechanical?.extractorVaneSwitch?.yesNoOk || '']);
  checklistData.push(['Exhaust CFM - Value', reportData.mechanical?.exhaustCfmValue?.status || '', reportData.mechanical?.exhaustCfmValue?.yesNoOk || '']);
  checklistData.push(["Light Engine's fans with LAD fan", reportData.mechanical?.lightEngineFansWithLadFan?.status || '', reportData.mechanical?.lightEngineFansWithLadFan?.yesNoOk || '']);
  checklistData.push(['Card Cage Top and Bottom fans', reportData.mechanical?.cardCageTopAndBottomFans?.status || '', reportData.mechanical?.cardCageTopAndBottomFans?.yesNoOk || '']);
  checklistData.push(['Radiator fan and Pump', reportData.mechanical?.radiatorFanAndPump?.status || '', reportData.mechanical?.radiatorFanAndPump?.yesNoOk || '']);
  checklistData.push(['Connector and hose for the Pump', reportData.mechanical?.connectorAndHoseForPump?.status || '', reportData.mechanical?.connectorAndHoseForPump?.yesNoOk || '']);
  checklistData.push(['Security and lamp house lock switch', reportData.mechanical?.securityAndLampHouseLockSwitch?.status || '', reportData.mechanical?.securityAndLampHouseLockSwitch?.yesNoOk || '']);
  
  // Lamp LOC Mechanism
  checklistData.push([{ content: 'Lamp LOC Mechanism X and Z movement', colSpan: 3, styles: { fillColor: [220, 230, 241], fontStyle: 'bold' } }]);
  checklistData.push(['', reportData.lampLocMechanism?.xAndZMovement?.status || '', reportData.lampLocMechanism?.xAndZMovement?.yesNoOk || '']);

  autoTable(pdf, {
    startY: yPosition,
    head: [['DESCRIPTION', 'STATUS', 'YES/NO-OK']],
    body: checklistData,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [100, 100, 100],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 10, right: 10 }
  });

  // ==================== PAGE 2: TECHNICAL DETAILS ====================
  
  pdf.addPage();
  yPosition = 15;

  // Projector placement
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Projector placement, room and environment', 12, yPosition);
  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(reportData.projectorPlacementRoomAndEnvironment || '', 12, yPosition);
  
  yPosition += 10;

  // Lamp Information Table
  const lampData = [
    ['Lamp Make and Model:', reportData.lampInfo?.makeAndModel || ''],
    ['Number of lamps running:', reportData.lampInfo?.numberOfLampsRunning?.toString() || ''],
    ['Current lamp running hours:', reportData.lampInfo?.currentLampRunningHours?.toString() || '']
  ];
  
  autoTable(pdf, {
    startY: yPosition,
    body: lampData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 120 }
    }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 5;

  // Voltage Parameters
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Voltage parameters:  P vs N: ${reportData.voltageParameters?.pVsN || ''}  P vs E: ${reportData.voltageParameters?.pVsE || ''}  N vs E: ${reportData.voltageParameters?.nVsE || ''}`, 12, yPosition);
  
  yPosition += 5;
  pdf.text(`fL measurements: ${reportData.flMeasurements || ''}`, 12, yPosition);
  
  yPosition += 5;
  pdf.text(`Content Player Model: ${reportData.contentPlayerModel || ''}`, 12, yPosition);
  
  yPosition += 5;
  pdf.text(`AC Status: ${reportData.acStatus || ''}`, 12, yPosition);
  
  yPosition += 5;
  pdf.text(`LE Status during PM: ${reportData.leStatusDuringPM || ''}`, 12, yPosition);
  
  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Remarks: ${reportData.remarks || ''}     LE S. No.: ${reportData.leSNo || ''}`, 12, yPosition);
  
  yPosition += 10;

  // Software Version Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Software Version', 12, yPosition);
  yPosition += 5;
  
  const softwareData = [
    ['W2K/4K', reportData.softwareVersion?.w2k4k?.mcgd || '', reportData.softwareVersion?.w2k4k?.fl || '', reportData.softwareVersion?.w2k4k?.x || '', reportData.softwareVersion?.w2k4k?.y || ''],
    ['R2K/4K', reportData.softwareVersion?.r2k4k?.mcgd || '', reportData.softwareVersion?.r2k4k?.fl || '', reportData.softwareVersion?.r2k4k?.x || '', reportData.softwareVersion?.r2k4k?.y || ''],
    ['G2K/4K', reportData.softwareVersion?.g2k4k?.mcgd || '', reportData.softwareVersion?.g2k4k?.fl || '', reportData.softwareVersion?.g2k4k?.x || '', reportData.softwareVersion?.g2k4k?.y || '']
  ];
  
  autoTable(pdf, {
    startY: yPosition,
    head: [['Version', 'MCGD', 'fL', 'x', 'y']],
    body: softwareData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [200, 200, 200], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' }
    }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 8;

  // Screen Information
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Screen Information in metres', 12, yPosition);
  yPosition += 5;
  
  const screenData = [
    ['SCOPE', reportData.screenInformation?.scope?.height || '', reportData.screenInformation?.scope?.width || '', reportData.screenInformation?.scope?.gain || ''],
    ['FLAT', reportData.screenInformation?.flat?.height || '', reportData.screenInformation?.flat?.width || '', reportData.screenInformation?.flat?.gain || '']
  ];
  
  autoTable(pdf, {
    startY: yPosition,
    head: [['', 'Height', 'Width', 'Gain']],
    body: screenData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [200, 200, 200] },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Screen Make: ${reportData.screenInformation?.screenMake || ''}     Throw Distance: ${reportData.screenInformation?.throwDistance || ''}`, 12, yPosition);
  
  yPosition += 10;

  // Image Evaluation
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Image Evaluation', 12, yPosition);
  yPosition += 5;
  
  const imageEvalData = [
    ['Focus/boresight', reportData.imageEvaluation?.focusBoresight || ''],
    ['Integrator Position', reportData.imageEvaluation?.integratorPosition || ''],
    ['Any Spot on the Screen after IPM', reportData.imageEvaluation?.spotOnScreenAfterIPM || ''],
    ['Cropping, Screen Edges 6X31 and SCOPE', reportData.imageEvaluation?.croppingScreenEdges6x31AndScope || ''],
    ['Convergence Checked', reportData.imageEvaluation?.convergenceChecked || ''],
    ['Channels Checked - Scope, Flat, Alternative', reportData.imageEvaluation?.channelsCheckedScopeFlatAlternative || ''],
    ['Pixel defects', reportData.imageEvaluation?.pixelDefects || ''],
    ['Excessive image vibration', reportData.imageEvaluation?.excessiveImageVibration || ''],
    ['LiteLOC', reportData.imageEvaluation?.liteLoc || '']
  ];
  
  autoTable(pdf, {
    startY: yPosition,
    head: [['Item', 'OK - Yes/No']],
    body: imageEvalData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [200, 200, 200] },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 30, halign: 'center' }
    }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 8;

  // CIE XYZ and Air Pollution (side by side)
  const leftX = 12;
  const rightX = 110;
  
  // CIE XYZ
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('CIE XYZ Color Accuracy', leftX, yPosition);
  
  const cieData = [
    ['BW Step-', reportData.cieXyzColorAccuracy?.bwStep?.x || '', reportData.cieXyzColorAccuracy?.bwStep?.y || '', reportData.cieXyzColorAccuracy?.bwStep?.fl || ''],
    ['10 2K/4K', reportData.cieXyzColorAccuracy?._10_2k4k?.x || '', reportData.cieXyzColorAccuracy?._10_2k4k?.y || '', reportData.cieXyzColorAccuracy?._10_2k4k?.fl || '']
  ];
  
  autoTable(pdf, {
    startY: yPosition + 3,
    head: [['Pattern', 'x', 'y', 'fL']],
    body: cieData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [220, 220, 220] },
    margin: { left: leftX },
    tableWidth: 90
  });

  // Air Pollution Level
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('Air Pollution Level', rightX, yPosition);
  
  const airData = [
    ['HCHO', reportData.airPollutionLevel?.hcho || '', 'PM2.5', reportData.airPollutionLevel?.pm25 || ''],
    ['TVOC', reportData.airPollutionLevel?.tvoc || '', 'PM10', reportData.airPollutionLevel?.pm10_full || ''],
    ['PM1.0', reportData.airPollutionLevel?.pm10 || '', 'Temp', reportData.airPollutionLevel?.temperature || ''],
    ['Humidity%', reportData.airPollutionLevel?.humidityPercent || '', '', '']
  ];
  
  autoTable(pdf, {
    startY: yPosition + 3,
    body: airData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 20, halign: 'center' },
      2: { fontStyle: 'bold', cellWidth: 20 },
      3: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: rightX },
    tableWidth: 85
  });

  yPosition = Math.max((pdf as any).lastAutoTable.finalY, yPosition + 30) + 10;

  // Signatures
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  
  // Client Signature
  pdf.text("Client's Signature & Stamp", 20, yPosition);
  
  // Engineer Signature
  pdf.text("Engineer's Signature", 130, yPosition);
  
  yPosition += 5;
  
  // Add signature images if available
  if (reportData.clientSignatureAndStamp?.signatureData) {
    try {
      pdf.addImage(reportData.clientSignatureAndStamp.signatureData, 'PNG', 15, yPosition, 60, 20);
    } catch (e) {
      console.error('Error adding client signature:', e);
    }
  }
  
  if (reportData.engineerSignature?.signatureData) {
    try {
      pdf.addImage(reportData.engineerSignature.signatureData, 'PNG', 125, yPosition, 60, 20);
    } catch (e) {
      console.error('Error adding engineer signature:', e);
    }
  }
  
  yPosition += 25;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Engineer: ${reportData.engineer?.name || ''}`, 130, yPosition);

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Report Number: ${reportData.reportNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save PDF
  pdf.save(`ASCOMP_${reportData.reportNumber}_${reportData.cinemaName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  
  return pdf;
}

