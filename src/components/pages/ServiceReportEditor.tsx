import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../../utils/api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Save, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { ASCOMPServiceReportForm } from '../ASCOMPServiceReportForm';
import { ValidationSummary } from '../ui/ValidationField';
import { validateServiceReport, ValidationError } from '../../utils/validation/reportValidation';

type Report = any;

function useDebouncedCallback<T extends (...args: any[]) => any>(cb: T, delay = 600) {
  const timer = useRef<number | undefined>(undefined);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => cb(...args), delay);
  }, [cb, delay]);
}

export function ServiceReportEditor({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getServiceReport(reportId);
      // Ensure structural defaults so form controls never crash
      data.sections = data.sections || {};
      data.sections.observations = data.sections.observations || ['','','','','',''];
      data.sections.recommendedParts = data.sections.recommendedParts || [];
      data.sections.opticals = data.sections.opticals || [];
      data.sections.electronics = data.sections.electronics || [];
      data.sections.mechanical = data.sections.mechanical || [];
      setReport(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    // Detect read-only mode from hash
    const hash = window.location.hash || '';
    const readonly = /readonly=1|\/readonly/.test(hash);
    setReadOnly(readonly);
    load();
  }, [load]);

  const debouncedSave = useDebouncedCallback(async (updated: Report) => {
    if (readOnly) return; // Do not save in read-only mode
    try {
      setSaving(true); setSaveState('saving');
      const saved = await apiClient.updateServiceReport(reportId, updated);
      setReport(saved);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
    } catch (e) {
      console.error(e);
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  }, 800);

  const update = (path: string, value: any) => {
    if (readOnly) return;
    if (!report) return;
    const clone = JSON.parse(JSON.stringify(report));
    // simple path setter: e.g., 'sections.environment.tempC'
    const keys = path.split('.');
    let obj: any = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      obj[k] = obj[k] ?? {};
      obj = obj[k];
    }
    obj[keys[keys.length - 1]] = value;
    setReport(clone);
    
    // Run validation on the updated report
    const validationResult = validateServiceReport(clone);
    setValidationErrors([
      ...validationResult.errors,
      ...validationResult.warnings,
      ...validationResult.suggestions
    ]);
    
    debouncedSave(clone);
  };

  const addRecommendedPart = () => {
    if (readOnly) return;
    if (!report) return;
    const next = { ...(report as any) };
    next.sections.recommendedParts = [...(next.sections.recommendedParts || []), { partName: '', partNumber: '', quantity: 1, notes: '' }];
    setReport(next);
    debouncedSave(next);
  };

  const header = useMemo(() => (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-dark-primary">Service Report</h1>
        <p className="text-sm text-dark-secondary mt-1">
          Visit: <Badge>{report?.visitId}</Badge> • Projector: <Badge>{report?.projectorSerial}</Badge> • Site: {report?.siteName}
        </p>
        {report?.engineer?.name && (
          <p className="text-xs text-dark-secondary mt-1">Engineer: {report.engineer.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {saveState === 'saving' && <span className="text-xs text-dark-secondary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving…</span>}
        {saveState === 'saved' && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Saved</span>}
        {saveState === 'error' && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Save failed</span>}
        <Button onClick={() => window.history.back()} className="gap-2"><ArrowLeft className="w-4 h-4"/>Back</Button>
      </div>
    </div>
  ), [report, saveState]);

  if (loading) {
    return (
      <div className="p-8 bg-dark-bg min-h-screen text-dark-secondary flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin"/>
        <span className="ml-2">Loading report…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-dark-bg min-h-screen text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  const handleSubmitFromWizard = async (formData: any) => {
    if (!report) return;
    try {
      setSaving(true); setSaveState('saving');
      const merged = { ...report, ...formData };
      const saved = await apiClient.updateServiceReport(reportId, merged);
      setReport(saved);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
      (window as any).showToast?.({ type: 'success', title: 'Report', message: 'Report saved' });
    } catch (e) {
      setSaveState('error');
      (window as any).showToast?.({ type: 'error', title: 'Report', message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {header}
        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg p-4 bg-white text-gray-900">
            <ValidationSummary validationErrors={validationErrors} />
          </div>
        )}
        
        <div className="rounded-lg p-4 bg-white text-gray-900 [--background:#ffffff] [--foreground:#111827] [--card:#ffffff] [--card-foreground:#111827] [--muted:#f3f4f6] [--muted-foreground:#374151] [--input:#ffffff] [--border:#e5e7eb] [--popover:#ffffff] [--popover-foreground:#111827]">
          <ASCOMPServiceReportForm
            initialData={report}
            onSubmit={handleSubmitFromWizard}
            onClose={() => window.history.back()}
          />
        </div>
      </div>
    </div>
  );
}

