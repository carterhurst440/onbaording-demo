import { useState } from 'react';
import type { OrgProfile } from '../types';
import { ENTITY_TYPES, PTO_OPTIONS, JURISDICTIONS } from '../constants';

interface Props {
  profile: OrgProfile;
  onChange: (updates: Partial<OrgProfile>) => void;
  completion: number;
}

interface FieldProps {
  label: string;
  value: string;
  filled: boolean;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number';
  placeholder?: string;
}

function Field({ label, value, filled, onChange, type = 'text', placeholder }: FieldProps) {
  return (
    <div className={`profile-field ${filled ? 'filled' : 'empty'}`}>
      <label className="field-label">
        {label}
        {filled && (
          <span className="field-check">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </label>
      <input
        className="field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}…`}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  filled: boolean;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

function SelectField({ label, value, filled, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className={`profile-field ${filled ? 'filled' : 'empty'}`}>
      <label className="field-label">
        {label}
        {filled && (
          <span className="field-check">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </label>
      <select
        className="field-input field-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder || `Select ${label.toLowerCase()}…`}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface PtoFieldProps {
  value: string;
  filled: boolean;
  onChange: (v: string) => void;
}

function PtoField({ value, filled, onChange }: PtoFieldProps) {
  return (
    <div className={`profile-field pto-field ${filled ? 'filled' : 'empty'}`}>
      <label className="field-label">
        PTO Policy
        {filled && (
          <span className="field-check">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </label>
      <div className="pto-options">
        {PTO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`pto-option ${value === opt.value ? 'selected' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <div className="pto-option-title">{opt.label}</div>
            <div className="pto-option-desc">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface LocationsFieldProps {
  value: string[];
  filled: boolean;
  onChange: (v: string[]) => void;
}

function LocationsField({ value, filled, onChange }: LocationsFieldProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = JURISDICTIONS.filter(
    (j) =>
      j.toLowerCase().includes(search.toLowerCase()) && !value.includes(j),
  );

  const toggle = (jurisdiction: string) => {
    if (value.includes(jurisdiction)) {
      onChange(value.filter((v) => v !== jurisdiction));
    } else {
      onChange([...value, jurisdiction]);
    }
  };

  return (
    <div className={`profile-field locations-field ${filled ? 'filled' : 'empty'}`}>
      <label className="field-label">
        Physical Locations
        {filled && (
          <span className="field-check">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </label>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="location-tags">
          {value.map((loc) => (
            <span key={loc} className="location-tag">
              {loc}
              <button className="tag-remove" onClick={() => toggle(loc)}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Search dropdown */}
      <div className="location-search-wrapper">
        <input
          className="field-input"
          placeholder="Search and add states…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && filtered.length > 0 && (
          <div className="location-dropdown">
            {filtered.slice(0, 10).map((j) => (
              <button
                key={j}
                className="location-option"
                onMouseDown={(e) => { e.preventDefault(); toggle(j); setSearch(''); }}
              >
                {j}
              </button>
            ))}
            {filtered.length > 10 && (
              <div className="location-more">+{filtered.length - 10} more — keep typing to narrow</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrgProfilePanel({ profile, onChange, completion }: Props) {
  const completedCount = Math.round((completion / 100) * 10);

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <div className="profile-title-row">
          <h2 className="profile-title">Org Profile</h2>
          <div className="completion-badge" style={{ '--pct': `${completion}%` } as React.CSSProperties}>
            <svg className="completion-ring" viewBox="0 0 36 36" width="48" height="48">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={completion === 100 ? '#10b981' : '#4f46e5'}
                strokeWidth="3"
                strokeDasharray={`${completion} ${100 - completion}`}
                strokeDashoffset="25"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            </svg>
            <span className="completion-num">{completion}%</span>
          </div>
        </div>
        <p className="profile-subtitle">
          {completedCount} of 10 sections complete
          {completion === 100 ? ' — Ready to proceed!' : ' — Chat to fill in the rest'}
        </p>
      </div>

      <div className="profile-fields">
        {/* Company Info */}
        <div className="field-section">
          <h3 className="section-title">Company Information</h3>
          <Field
            label="Company Name"
            value={profile.companyName}
            filled={!!profile.companyName}
            onChange={(v) => onChange({ companyName: v })}
            placeholder="e.g. Acme Corporation"
          />
          <SelectField
            label="Entity Type"
            value={profile.entityType}
            filled={!!profile.entityType}
            onChange={(v) => onChange({ entityType: v })}
            options={ENTITY_TYPES}
          />
          <Field
            label="Industry"
            value={profile.industry}
            filled={!!profile.industry}
            onChange={(v) => onChange({ industry: v })}
            placeholder="e.g. Technology, Healthcare…"
          />
        </div>

        {/* Size & Age */}
        <div className="field-section">
          <h3 className="section-title">Workforce Details</h3>
          <Field
            label="Total Employees"
            value={profile.totalEmployees}
            filled={!!profile.totalEmployees}
            onChange={(v) => onChange({ totalEmployees: v })}
            type="number"
            placeholder="e.g. 42"
          />
          <Field
            label="Youngest Employee Age"
            value={profile.youngestEmployeeAge}
            filled={!!profile.youngestEmployeeAge}
            onChange={(v) => onChange({ youngestEmployeeAge: v })}
            type="number"
            placeholder="e.g. 18"
          />
          <Field
            label="Operating Years"
            value={profile.operatingYears}
            filled={!!profile.operatingYears}
            onChange={(v) => onChange({ operatingYears: v })}
            type="number"
            placeholder="e.g. 5"
          />
        </div>

        {/* PTO */}
        <div className="field-section">
          <h3 className="section-title">PTO Policy</h3>
          <PtoField
            value={profile.ptoHandling}
            filled={!!profile.ptoHandling}
            onChange={(v) => onChange({ ptoHandling: v })}
          />
        </div>

        {/* HR Contact */}
        <div className="field-section">
          <h3 className="section-title">HR Contact</h3>
          <p className="section-subtitle">Employees contact this person for handbook questions</p>
          <Field
            label="Full Name"
            value={profile.hrContactName}
            filled={!!profile.hrContactName}
            onChange={(v) => onChange({ hrContactName: v })}
            placeholder="e.g. Jane Smith"
          />
          <Field
            label="Email"
            value={profile.hrContactEmail}
            filled={!!profile.hrContactEmail}
            onChange={(v) => onChange({ hrContactEmail: v })}
            type="email"
            placeholder="e.g. hr@company.com"
          />
          <Field
            label="Phone"
            value={profile.hrContactPhone}
            filled={!!profile.hrContactPhone}
            onChange={(v) => onChange({ hrContactPhone: v })}
            type="tel"
            placeholder="e.g. (555) 123-4567"
          />
        </div>

        {/* Backup Contact */}
        <div className="field-section">
          <h3 className="section-title">Backup Contact</h3>
          <p className="section-subtitle">For sensitive reports (e.g. harassment complaints)</p>
          <Field
            label="Full Name"
            value={profile.backupContactName}
            filled={!!profile.backupContactName}
            onChange={(v) => onChange({ backupContactName: v })}
            placeholder="e.g. John Doe"
          />
          <Field
            label="Email"
            value={profile.backupContactEmail}
            filled={!!profile.backupContactEmail}
            onChange={(v) => onChange({ backupContactEmail: v })}
            type="email"
            placeholder="e.g. legal@company.com"
          />
          <Field
            label="Phone"
            value={profile.backupContactPhone}
            filled={!!profile.backupContactPhone}
            onChange={(v) => onChange({ backupContactPhone: v })}
            type="tel"
            placeholder="e.g. (555) 987-6543"
          />
        </div>

        {/* Locations */}
        <div className="field-section">
          <h3 className="section-title">Physical Locations</h3>
          <p className="section-subtitle">States/jurisdictions with employees or offices</p>
          <LocationsField
            value={profile.physicalLocations}
            filled={profile.physicalLocations.length > 0}
            onChange={(v) => onChange({ physicalLocations: v })}
          />
        </div>
      </div>
    </div>
  );
}
