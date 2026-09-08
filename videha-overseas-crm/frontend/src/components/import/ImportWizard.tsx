import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { ImportEntityType, ImportPreviewResult } from '../../types/crm';
import {
  applyMappingSelection,
  getDuplicateMappedFieldKeys,
  getMissingRequiredMappings,
  normalizeImportFields,
  type ImportFieldMeta
} from '../../lib/importMeta';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { alertSaveError } from '../../lib/apiErrors';

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_FILE_ERROR = 'CSV file must be 5MB or smaller.';

const ENTITY_LABELS: Record<ImportEntityType, string> = {
  leads: 'Leads',
  companies: 'Companies',
  customers: 'Customers',
  'follow-ups': 'Follow-ups',
  quotations: 'Quotations',
  orders: 'Orders'
};

type Step = 'upload' | 'mapping' | 'preview' | 'done';

interface ImportWizardProps {
  entity: ImportEntityType;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

function syncFieldsFromResponse(
  current: ImportFieldMeta[],
  raw: unknown
): ImportFieldMeta[] {
  const normalized = normalizeImportFields(raw);
  return normalized.length > 0 ? normalized : current;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  entity,
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<ImportFieldMeta[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    processed: number;
    failed: number;
    skipped: number;
    duplicates: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [entityLabel, setEntityLabel] = useState('');

  const loadMeta = useCallback(async () => {
    if (!entity) return;

    setMetaLoading(true);
    setMetaError(null);
    try {
      const res = await api.import.getMeta(entity);
      if (res.success) {
        const normalized = normalizeImportFields(res.data.fields);
        if (normalized.length === 0) {
          setMetaError('Import field metadata is empty. Please retry or contact support.');
          setFields([]);
        } else {
          setFields(normalized);
        }
        setEntityLabel(res.data.label || ENTITY_LABELS[entity]);
      } else {
        setMetaError('Failed to load import field metadata.');
      }
    } catch (err: unknown) {
      setMetaError('Failed to load import field metadata.');
      alertSaveError(err, 'Failed to load import settings');
    } finally {
      setMetaLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    if (!isOpen || !entity) return;

    setStep('upload');
    setFile(null);
    setFields([]);
    setHeaders([]);
    setMapping({});
    setPreview(null);
    setResult(null);
    setMetaError(null);
    setEntityLabel(ENTITY_LABELS[entity]);
    void loadMeta();
  }, [isOpen, entity, loadMeta]);

  const fieldOptions = useMemo(
    () => [
      { value: '', label: '— Skip column —' },
      ...fields.map(field => ({
        value: field.key,
        label: `${field.label}${field.required ? ' *' : ''}`
      }))
    ],
    [fields]
  );

  const missingRequired = useMemo(
    () => getMissingRequiredMappings(fields, mapping),
    [fields, mapping]
  );

  const duplicateMappedKeys = useMemo(
    () => getDuplicateMappedFieldKeys(mapping),
    [mapping]
  );

  const handleFileSelect = (selected: File | null) => {
    if (selected && selected.size > MAX_IMPORT_FILE_BYTES) {
      alert(MAX_IMPORT_FILE_ERROR);
      return;
    }
    setFile(selected);
    setPreview(null);
    setResult(null);
  };

  const applyPreviewResponse = (data: ImportPreviewResult) => {
    setPreview(data);
    setHeaders(data.headers);
    setMapping(data.mapping);
    setFields(current => syncFieldsFromResponse(current, data.fields));
  };

  const validateMapping = (): boolean => {
    if (fields.length === 0) {
      alert('Import field metadata is not loaded yet. Please wait or retry loading metadata.');
      return false;
    }

    if (duplicateMappedKeys.length > 0) {
      alert(`Each CRM field can only be mapped once: ${duplicateMappedKeys.join(', ')}`);
      return false;
    }

    if (missingRequired.length > 0) {
      alert(`Required fields not mapped: ${missingRequired.map(field => field.label).join(', ')}`);
      return false;
    }

    return true;
  };

  const runPreview = async (nextMapping?: Record<string, string | null>) => {
    if (!file || !entity) return;
    const mappingToUse = nextMapping ?? mapping;
    if (!validateMapping()) return;

    setIsLoading(true);
    try {
      const res = await api.import.preview(entity, file, mappingToUse);
      if (res.success) {
        applyPreviewResponse(res.data);
        setStep('preview');
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to preview import');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadNext = async () => {
    if (!file || !entity) return;
    if (metaLoading) return;
    if (metaError || fields.length === 0) {
      alert(metaError || 'Import field metadata is not available.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.import.preview(entity, file);
      if (res.success) {
        applyPreviewResponse(res.data);
        setStep('mapping');
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || !entity) return;
    setIsLoading(true);
    try {
      const res = await api.import.confirm(entity, preview.sessionId);
      if (res.success) {
        setResult({
          imported: res.data.imported,
          processed: res.data.processed,
          failed: res.data.failed,
          skipped: res.data.skipped,
          duplicates: res.data.duplicates,
        });
        setStep('done');
        onComplete?.();
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!preview || !entity) return;
    try {
      await api.import.downloadErrors(
        entity,
        preview.sessionId,
        `videha_${entity}_import_errors.csv`
      );
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to download error CSV');
    }
  };

  if (!entity) return null;

  const titleLabel = entityLabel || ENTITY_LABELS[entity];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import ${titleLabel} CSV`}
      subtitle="Upload, map columns, review validation, then confirm import"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {(['upload', 'mapping', 'preview', 'done'] as Step[]).map((item, index) => (
            <React.Fragment key={item}>
              <span className={step === item ? 'text-sky-700 font-semibold' : ''}>
                {index + 1}. {item.charAt(0).toUpperCase() + item.slice(1)}
              </span>
              {index < 3 && <ArrowRight className="w-3 h-3" />}
            </React.Fragment>
          ))}
        </div>

        {metaLoading && (
          <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            Loading import field metadata…
          </div>
        )}

        {metaError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
            <span>{metaError}</span>
            <button
              type="button"
              onClick={() => void loadMeta()}
              className="inline-flex items-center gap-1 px-2 py-1 border border-rose-200 rounded-md hover:bg-rose-100"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">
                {file ? file.name : 'Choose CSV file (max 5 MB, 1000 rows)'}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!file || isLoading || metaLoading || Boolean(metaError) || fields.length === 0}
                onClick={handleUploadNext}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Continue to Mapping
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Map each CSV column to a CRM field. Required fields are marked with * and must be mapped
              before preview.
            </p>

            {fields.some(field => field.required) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <span className="font-medium text-slate-700">Required CRM fields: </span>
                {fields
                  .filter(field => field.required)
                  .map(field => field.label)
                  .join(', ')}
              </div>
            )}

            {missingRequired.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                Still unmapped: {missingRequired.map(field => field.label).join(', ')}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {headers.map(header => (
                <div key={header} className="grid grid-cols-2 gap-3 items-center">
                  <span className="text-xs font-medium text-slate-700 truncate">{header}</span>
                  <SearchableSelect
                    options={fieldOptions}
                    value={mapping[header] || ''}
                    onChange={value =>
                      setMapping(prev => applyMappingSelection(prev, header, value))
                    }
                    placeholder={fields.length === 0 ? 'Loading fields…' : 'Select field'}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={isLoading || fields.length === 0 || missingRequired.length > 0}
                onClick={() => runPreview(mapping)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Validate & Preview
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-lg font-semibold text-slate-800">{preview.summary.totalRows}</div>
                <div className="text-[10px] text-slate-500 uppercase">Total Rows</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-lg font-semibold text-emerald-800">{preview.summary.validRows}</div>
                <div className="text-[10px] text-emerald-700 uppercase">Valid</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
                <div className="text-lg font-semibold text-rose-800">{preview.summary.errorRows}</div>
                <div className="text-[10px] text-rose-700 uppercase">Errors</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <div className="text-lg font-semibold text-amber-800">{preview.summary.duplicateRows}</div>
                <div className="text-[10px] text-amber-700 uppercase">Duplicates</div>
              </div>
            </div>

            {preview.summary.errorRows > 0 && (
              <button
                type="button"
                onClick={handleDownloadErrors}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download Error CSV
              </button>
            )}

            <div className="max-h-56 overflow-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Row</th>
                    <th className="px-2 py-1.5 text-left">Status</th>
                    <th className="px-2 py-1.5 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map(row => (
                    <tr key={row.rowNumber} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">{row.rowNumber}</td>
                      <td className="px-2 py-1.5">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <AlertTriangle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {row.errors.length ? row.errors.join('; ') : 'Ready to import'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={isLoading || preview.summary.validRows === 0}
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Importing…' : `Import ${preview.summary.validRows} Valid Rows`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-3 text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Import Complete</p>
            <p className="text-xs text-slate-600">
              Processed {result.processed} row(s). Created {result.imported} record(s). Skipped{' '}
              {result.skipped} invalid row(s).
              {result.duplicates > 0 ? ` ${result.duplicates} duplicate row(s) detected in preview.` : ''}
              {result.failed > 0 ? ` ${result.failed} row(s) failed during commit.` : ''}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
