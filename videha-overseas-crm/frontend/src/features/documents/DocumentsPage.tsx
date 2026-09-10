import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Download,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  Folder
} from 'lucide-react';
import { api } from '../../api/client';
import {
  CrmDocument,
  DocumentCategory,
  DocumentEntityType,
  Lead,
  Company,
  Customer,
  Quotation,
  Order
} from '../../types/crm';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { useAuth } from '../../context/AuthContext';
import { alertSaveError, handleConflictWithReload } from '../../lib/apiErrors';
import { ownScopeEmptyCopy } from '../../components/ui/ListStatePanel';

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'KYC', label: 'KYC' },
  { value: 'Quotation', label: 'Quotation' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Shipping', label: 'Shipping' },
  { value: 'Other', label: 'Other' }
];

const ENTITY_TYPE_OPTIONS: { value: DocumentEntityType; label: string }[] = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Company', label: 'Company' },
  { value: 'Customer', label: 'Customer' },
  { value: 'Quotation', label: 'Quotation' },
  { value: 'Order', label: 'Order' }
];

const FILE_KIND_OPTIONS = [
  { value: 'all', label: 'All file types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Word / Excel' }
];

// Category badge colors — keeps categories visually scannable at a glance
const CATEGORY_STYLES: Record<DocumentCategory, string> = {
  KYC: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Quotation: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Invoice: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  Contract: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Shipping: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Other: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
};

type UploadForm = {
  title: string;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  file: File | null;
};

const emptyUploadForm = (): UploadForm => ({
  title: '',
  category: 'Other',
  entityType: 'Lead',
  entityId: '',
  file: null
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKindLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('sheet')) {
    return 'Document';
  }
  return 'File';
}

export const DocumentsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [fileKindFilter, setFileKindFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUploadForm());
  const [isUploading, setIsUploading] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CrmDocument | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const entityOptions = useMemo(() => {
    switch (uploadForm.entityType) {
      case 'Lead':
        return leads.map(item => ({ value: item.id, label: `${item.leadCode} — ${item.company}` }));
      case 'Company':
        return companies.map(item => ({ value: item.id, label: `${item.companyCode} — ${item.name}` }));
      case 'Customer':
        return customers.map(item => ({ value: item.id, label: `${item.customerCode} — ${item.name}` }));
      case 'Quotation':
        return quotations.map(item => ({
          value: item.id,
          label: `${item.quotationCode} — ${item.title}`
        }));
      case 'Order':
        return orders.map(item => ({
          value: item.id,
          label: `${item.orderCode} — ${item.company || item.customerName}`
        }));
      default:
        return [];
    }
  }, [uploadForm.entityType, leads, companies, customers, quotations, orders]);

  const fetchDocuments = async (pageNum = page) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.documents.getDocuments({
        search: search.trim() || undefined,
        category: categoryFilter,
        entityType: entityTypeFilter,
        fileKind: fileKindFilter,
        page: pageNum,
        limit
      });
      if (res.success) {
        setDocuments(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setLoadError(message);
      alertSaveError(err, 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1);
  }, [search, categoryFilter, entityTypeFilter, fileKindFilter]);

  useEffect(() => {
    Promise.all([
      api.leads.getLeads({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
      api.companies.getCompanies({ limit: 100 }),
      api.customers.getCustomers({ limit: 100 }),
      api.quotations.getQuotations({ limit: 100 }),
      api.orders.getOrders({ limit: 100 })
    ]).then(([leadRes, companyRes, customerRes, quotationRes, orderRes]) => {
      if (leadRes.success) setLeads(leadRes.items);
      if (companyRes.success) setCompanies(companyRes.data);
      if (customerRes.success) setCustomers(customerRes.data);
      if (quotationRes.success) setQuotations(quotationRes.data);
      if (orderRes.success) setOrders(orderRes.data);
    });
  }, []);

  const openUpload = () => {
    setUploadForm(emptyUploadForm());
    setIsUploadOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.entityId) return;
    setIsUploading(true);
    try {
      await api.documents.uploadDocument({
        file: uploadForm.file,
        title: uploadForm.title.trim() || uploadForm.file.name,
        category: uploadForm.category,
        entityType: uploadForm.entityType,
        entityId: uploadForm.entityId
      });
      setIsUploadOpen(false);
      fetchDocuments(1);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const openRename = (doc: CrmDocument) => {
    setRenameTarget(doc);
    setRenameTitle(doc.title);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameTitle.trim()) return;
    setIsRenaming(true);
    try {
      await api.documents.renameDocument(renameTarget.id, {
        title: renameTitle.trim(),
        revision: renameTarget.revision
      });
      setRenameTarget(null);
      fetchDocuments(page);
    } catch (err: unknown) {
      handleConflictWithReload(err, () => fetchDocuments(page), 'Failed to rename document');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (doc: CrmDocument) => {
    if (!window.confirm(`Delete "${doc.title}"? This removes the file from Cloudinary.`)) return;
    try {
      await api.documents.deleteDocument(doc.id);
      fetchDocuments(page);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to delete document');
    }
  };

  const handlePreview = async (doc: CrmDocument) => {
    try {
      await api.documents.previewDocument(doc.id);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to preview document');
    }
  };

  const handleDownload = async (doc: CrmDocument) => {
    try {
      await api.documents.downloadDocument(doc.id, doc.fileName || doc.title);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to download document');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload, preview, and manage CRM files stored in Cloudinary under crm/documents/
            </p>
          </div>
        </div>
        {hasPermission('documents.create') && (
          <button
            type="button"
            onClick={openUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Total count strip */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-700">{total}</span>
        <span>{total === 1 ? 'document' : 'documents'} on file</span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, file name, code, or linked record…"
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-shadow"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <SearchableSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Linked entity type
            </label>
            <SearchableSelect
              value={entityTypeFilter}
              onChange={setEntityTypeFilter}
              options={[{ value: 'all', label: 'All entity types' }, ...ENTITY_TYPE_OPTIONS]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              File type
            </label>
            <SearchableSelect
              value={fileKindFilter}
              onChange={setFileKindFilter}
              options={FILE_KIND_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Linked To</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Size</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Uploaded</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-500 text-sm animate-pulse">
                    Loading documents…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-rose-600 text-sm">
                    {loadError}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-500 text-sm">
                    {user?.roleName === 'SALES_MEMBER' && !search.trim()
                      ? ownScopeEmptyCopy('documents').title
                      : 'No documents found.'}
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 text-sm">{doc.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {doc.documentCode} · {doc.fileName}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.Other}`}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 text-sm">{doc.entityType}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{doc.entityLabel || doc.entityCode}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 text-sm">
                        {doc.mimeType.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-600" />
                        )}
                        {fileKindLabel(doc.mimeType)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 text-sm">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {doc.createdByName || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handlePreview(doc)}
                          className="p-2 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-2 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {hasPermission('documents.edit') && (
                          <button
                            type="button"
                            onClick={() => openRename(doc)}
                            className="p-2 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Rename"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('documents.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-2 rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onPageChange={p => fetchDocuments(p)}
        label="documents"
      />

      {/* Upload modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document" size="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              value={uploadForm.title}
              onChange={e => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Display name for this document"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-shadow"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <SearchableSelect
                value={uploadForm.category}
                onChange={value =>
                  setUploadForm(prev => ({ ...prev, category: value as DocumentCategory }))
                }
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Link to entity type</label>
              <SearchableSelect
                value={uploadForm.entityType}
                onChange={value =>
                  setUploadForm(prev => ({
                    ...prev,
                    entityType: value as DocumentEntityType,
                    entityId: ''
                  }))
                }
                options={ENTITY_TYPE_OPTIONS}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Linked record</label>
            <SearchableSelect
              value={uploadForm.entityId}
              onChange={value => setUploadForm(prev => ({ ...prev, entityId: value }))}
              options={[{ value: '', label: 'Select a record…' }, ...entityOptions]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">File</label>
            <label className="flex items-center gap-3 px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-600">
                {uploadForm.file
                  ? `${uploadForm.file.name} (${formatFileSize(uploadForm.file.size)})`
                  : 'Choose PDF, image, Word, or Excel file (max 10 MB)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,application/pdf,image/*"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setUploadForm(prev => ({
                    ...prev,
                    file,
                    title: prev.title || file?.name || ''
                  }));
                }}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !uploadForm.file || !uploadForm.entityId}
              className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rename modal */}
      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename Document"
        size="sm"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              value={renameTitle}
              onChange={e => setRenameTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-shadow"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenaming || !renameTitle.trim()}
              className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRenaming ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};