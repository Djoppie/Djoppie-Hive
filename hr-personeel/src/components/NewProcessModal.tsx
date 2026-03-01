import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Search, UserPlus, UserMinus, FileText } from 'lucide-react';
import { onboardingService } from '../services/onboardingService';
import { employeesApi, type Employee } from '../services/api';
import type {
  OnboardingProcessType,
  OnboardingTemplateDto,
  CreateOnboardingProcessDto,
  CreateProcessFromTemplateDto,
} from '../types/onboarding';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: OnboardingProcessType;
}

interface FormData {
  type: OnboardingProcessType;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  titel: string;
  beschrijving: string;
  geplandeStartdatum: string;
  gewensteEinddatum: string;
  templateId: string;
  prioriteit: number;
  verantwoordelijkeEmail: string;
  verantwoordelijkeNaam: string;
}

const defaultFormData: FormData = {
  type: 'Onboarding',
  employeeId: '',
  employeeName: '',
  employeeEmail: '',
  titel: '',
  beschrijving: '',
  geplandeStartdatum: new Date().toISOString().split('T')[0],
  gewensteEinddatum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  templateId: '',
  prioriteit: 1,
  verantwoordelijkeEmail: '',
  verantwoordelijkeNaam: '',
};

export default function NewProcessModal({ open, onClose, onSuccess, defaultType }: Props) {
  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    type: defaultType || 'Onboarding',
  });
  const [templates, setTemplates] = useState<OnboardingTemplateDto[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        ...defaultFormData,
        type: defaultType || 'Onboarding',
      });
      setError(null);
      setEmployeeSearch('');
      setEmployeeResults([]);
    }
  }, [open, defaultType]);

  // Fetch templates when type changes
  useEffect(() => {
    if (!open) return;

    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const data = await onboardingService.getTemplates(formData.type);
        setTemplates(data);
        // Auto-select default template if available
        const defaultTemplate = data.find(t => t.isDefault);
        if (defaultTemplate) {
          setFormData(prev => ({
            ...prev,
            templateId: defaultTemplate.id,
            titel: prev.titel || `${prev.type} - `,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [open, formData.type]);

  // Debounced employee search
  useEffect(() => {
    if (employeeSearch.length < 2) {
      setEmployeeResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setEmployeeSearching(true);
      try {
        const results = await employeesApi.search(employeeSearch);
        setEmployeeResults(results.slice(0, 10)); // Limit to 10 results
      } catch (err) {
        console.error('Employee search failed:', err);
        setEmployeeResults([]);
      } finally {
        setEmployeeSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [employeeSearch]);

  // Handle employee selection
  const handleSelectEmployee = useCallback((employee: Employee) => {
    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      employeeName: employee.displayName,
      employeeEmail: employee.email,
      titel: prev.titel || `${prev.type} - ${employee.displayName}`,
    }));
    setEmployeeSearch(employee.displayName);
    setShowEmployeeDropdown(false);
    setEmployeeResults([]);
  }, []);

  // Clear selected employee
  const handleClearEmployee = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      employeeId: '',
      employeeName: '',
      employeeEmail: '',
    }));
    setEmployeeSearch('');
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.employeeId) {
      setError('Selecteer een medewerker');
      return;
    }

    if (!formData.titel.trim()) {
      setError('Vul een titel in');
      return;
    }

    setSubmitting(true);

    try {
      if (formData.templateId) {
        // Create from template
        const dto: CreateProcessFromTemplateDto = {
          templateId: formData.templateId,
          employeeId: formData.employeeId,
          geplandeStartdatum: formData.geplandeStartdatum,
          verantwoordelijkeEmail: formData.verantwoordelijkeEmail || undefined,
          verantwoordelijkeNaam: formData.verantwoordelijkeNaam || undefined,
        };
        await onboardingService.createProcessFromTemplate(dto);
      } else {
        // Create without template
        const dto: CreateOnboardingProcessDto = {
          type: formData.type,
          employeeId: formData.employeeId,
          titel: formData.titel,
          beschrijving: formData.beschrijving || undefined,
          geplandeStartdatum: formData.geplandeStartdatum,
          gewensteEinddatum: formData.gewensteEinddatum,
          prioriteit: formData.prioriteit,
          verantwoordelijkeEmail: formData.verantwoordelijkeEmail || undefined,
          verantwoordelijkeNaam: formData.verantwoordelijkeNaam || undefined,
        };
        await onboardingService.createProcess(dto);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {formData.type === 'Onboarding' ? (
              <>
                <UserPlus size={24} className="modal-icon onboarding" />
                Nieuw Onboarding Proces
              </>
            ) : (
              <>
                <UserMinus size={24} className="modal-icon offboarding" />
                Nieuw Offboarding Proces
              </>
            )}
          </h2>
          <button className="icon-btn" onClick={onClose} disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* Process Type Toggle */}
          <div className="form-group">
            <label>Type Proces *</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`toggle-btn ${formData.type === 'Onboarding' ? 'active onboarding' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'Onboarding', templateId: '' }))}
              >
                <UserPlus size={18} />
                Onboarding
              </button>
              <button
                type="button"
                className={`toggle-btn ${formData.type === 'Offboarding' ? 'active offboarding' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'Offboarding', templateId: '' }))}
              >
                <UserMinus size={18} />
                Offboarding
              </button>
            </div>
          </div>

          {/* Employee Search */}
          <div className="form-group">
            <label htmlFor="employee">Medewerker *</label>
            <div className="employee-search-wrapper">
              <div className="search-input-container">
                <Search size={16} className="search-icon" />
                <input
                  id="employee"
                  type="text"
                  placeholder="Zoek medewerker op naam of email..."
                  value={employeeSearch}
                  onChange={e => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                    if (formData.employeeId) {
                      handleClearEmployee();
                    }
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  autoComplete="off"
                />
                {employeeSearching && <Loader2 size={16} className="search-spinner" />}
              </div>

              {/* Employee dropdown */}
              {showEmployeeDropdown && employeeResults.length > 0 && (
                <div className="employee-dropdown">
                  {employeeResults.map(emp => (
                    <div
                      key={emp.id}
                      className="employee-option"
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      <div className="employee-info">
                        <span className="employee-name">{emp.displayName}</span>
                        <span className="employee-email">{emp.email}</span>
                      </div>
                      {emp.jobTitle && (
                        <span className="employee-job">{emp.jobTitle}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected employee indicator */}
              {formData.employeeId && (
                <div className="selected-employee">
                  <span>{formData.employeeName}</span>
                  <span className="selected-email">{formData.employeeEmail}</span>
                  <button type="button" className="clear-btn" onClick={handleClearEmployee}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-group">
            <label htmlFor="template">
              Template
              {templatesLoading && <Loader2 size={14} className="inline-spinner" />}
            </label>
            <div className="template-select-wrapper">
              <FileText size={16} className="select-icon" />
              <select
                id="template"
                value={formData.templateId}
                onChange={e => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                disabled={templatesLoading}
              >
                <option value="">-- Geen template (handmatig) --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.naam} {t.isDefault ? '(Standaard)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {formData.templateId && (
              <p className="form-help">
                Taken worden automatisch aangemaakt op basis van de template.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="titel">Titel *</label>
            <input
              id="titel"
              type="text"
              required
              placeholder="Bijv. Onboarding - Jan Janssen"
              value={formData.titel}
              onChange={e => setFormData(prev => ({ ...prev, titel: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="beschrijving">Beschrijving</label>
            <textarea
              id="beschrijving"
              rows={3}
              placeholder="Optionele beschrijving of opmerkingen..."
              value={formData.beschrijving}
              onChange={e => setFormData(prev => ({ ...prev, beschrijving: e.target.value }))}
            />
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startdatum">Geplande Startdatum *</label>
              <input
                id="startdatum"
                type="date"
                required
                value={formData.geplandeStartdatum}
                onChange={e => setFormData(prev => ({ ...prev, geplandeStartdatum: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="einddatum">Gewenste Einddatum *</label>
              <input
                id="einddatum"
                type="date"
                required
                value={formData.gewensteEinddatum}
                min={formData.geplandeStartdatum}
                onChange={e => setFormData(prev => ({ ...prev, gewensteEinddatum: e.target.value }))}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="prioriteit">Prioriteit</label>
            <select
              id="prioriteit"
              value={formData.prioriteit}
              onChange={e => setFormData(prev => ({ ...prev, prioriteit: parseInt(e.target.value) }))}
            >
              <option value={0}>Laag</option>
              <option value={1}>Normaal</option>
              <option value={2}>Hoog</option>
            </select>
          </div>

          {/* Responsible Person */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="verantwoordelijkeNaam">Verantwoordelijke (optioneel)</label>
              <input
                id="verantwoordelijkeNaam"
                type="text"
                placeholder="Naam"
                value={formData.verantwoordelijkeNaam}
                onChange={e => setFormData(prev => ({ ...prev, verantwoordelijkeNaam: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="verantwoordelijkeEmail">Email Verantwoordelijke</label>
              <input
                id="verantwoordelijkeEmail"
                type="email"
                placeholder="email@voorbeeld.be"
                value={formData.verantwoordelijkeEmail}
                onChange={e => setFormData(prev => ({ ...prev, verantwoordelijkeEmail: e.target.value }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.employeeId}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  Aanmaken...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Proces Aanmaken
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-lg {
          max-width: 640px;
          width: 100%;
        }

        .modal-icon {
          margin-right: 10px;
          vertical-align: middle;
        }

        .modal-icon.onboarding {
          color: var(--color-success);
        }

        .modal-icon.offboarding {
          color: var(--color-warning);
        }

        .form-error {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          padding: 12px 16px;
          border-radius: var(--border-radius-md);
          margin-bottom: 16px;
          border: 1px solid var(--color-danger);
        }

        .type-toggle {
          display: flex;
          gap: 8px;
        }

        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .toggle-btn:hover {
          border-color: var(--color-primary);
          color: var(--text-primary);
        }

        .toggle-btn.active.onboarding {
          border-color: var(--color-success);
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .toggle-btn.active.offboarding {
          border-color: var(--color-warning);
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .employee-search-wrapper {
          position: relative;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-container .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input-container input {
          padding-left: 38px;
          padding-right: 38px;
        }

        .search-spinner {
          position: absolute;
          right: 12px;
          color: var(--color-primary);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .employee-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-height: 240px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .employee-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.15s ease;
        }

        .employee-option:last-child {
          border-bottom: none;
        }

        .employee-option:hover {
          background: var(--bg-main);
        }

        .employee-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .employee-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .employee-email {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .employee-job {
          font-size: 12px;
          color: var(--text-muted);
          background: var(--bg-main);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .selected-employee {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          background: var(--color-success-bg);
          border: 1px solid var(--color-success);
          border-radius: var(--border-radius-sm);
          color: var(--color-success);
        }

        .selected-email {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .clear-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--color-danger);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-btn:hover {
          background: var(--color-danger-bg);
        }

        .template-select-wrapper {
          position: relative;
        }

        .template-select-wrapper .select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .template-select-wrapper select {
          padding-left: 38px;
        }

        .form-help {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .inline-spinner {
          display: inline-block;
          margin-left: 8px;
          animation: spin 1s linear infinite;
          vertical-align: middle;
        }

        .btn-spinner {
          animation: spin 1s linear infinite;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .modal-lg {
            max-width: 100%;
            margin: 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .type-toggle {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
