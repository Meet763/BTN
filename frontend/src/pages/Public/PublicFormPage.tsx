import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../api/apiBase';
import { GiftPicker } from '../../components/GiftPicker';
import { WORLD_COUNTRIES, WORLD_STATES } from '../../data/worldStates';
import { DEFAULT_GIFT_APPEARANCE, giftThemeCssVars, resolveGiftAppearance, type GiftAppearance } from './giftFormThemes';
import type { FieldDraft } from '../Forms/formCatalog';
import './GiftCampaignPage.css';

const youtubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
  return match?.[1] ?? '';
};

export const PublicFormPage: React.FC = () => {
  const { slug = '' } = useParams();
  const [appearance, setAppearance] = useState<GiftAppearance>(DEFAULT_GIFT_APPEARANCE);
  const [missing, setMissing] = useState(false);
  const [meta, setMeta] = useState({ name: '', introTitle: '', introBody: '', submitLabel: 'Submit' });
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [phase, setPhase] = useState<'intro' | 'form' | 'done'>('intro');
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const themeVars = useMemo(() => giftThemeCssVars(appearance), [appearance]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/public/campaign/appearance`).then((res) => {
      setAppearance(resolveGiftAppearance(res.data?.data));
    }).catch(() => setAppearance(DEFAULT_GIFT_APPEARANCE));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/public/forms/${slug}`).then((res) => {
      const data = res.data?.data;
      setMeta({
        name: data.name,
        introTitle: data.introTitle,
        introBody: data.introBody,
        submitLabel: data.submitLabel || 'Submit',
      });
      setFields(data.fields || []);
      document.title = data.name || 'Form';
    }).catch(() => setMissing(true));
  }, [slug]);

  const current = fields[step];
  const progress = fields.length ? ((step + 1) / fields.length) * 100 : 0;

  const validate = (field: FieldDraft) => {
    const value = (values[field.fieldKey] || '').trim();
    if (field.fieldType === 'youtube') return '';
    if (field.fieldType === 'document') {
      return field.isRequired && !files[field.fieldKey] ? 'Upload a file to continue.' : '';
    }
    if (!value) return field.isRequired ? 'This answer is required.' : '';
    if (field.fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    if (field.fieldType === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return 'Enter a phone number with 7 to 15 digits.';
    }
    if (field.fieldType === 'number') {
      const number = Number(value);
      if (Number.isNaN(number)) return 'Enter a number.';
      if (field.validation?.min != null && number < field.validation.min) return `Must be at least ${field.validation.min}.`;
      if (field.validation?.max != null && number > field.validation.max) return `Must be at most ${field.validation.max}.`;
    }
    if (field.fieldType === 'videoLink' && !youtubeId(value)) return 'Paste a YouTube video link.';
    if (field.fieldType === 'website' && !/^https?:\/\//i.test(value)) return 'Start the link with https://.';
    const min = field.validation?.minLength;
    const max = field.validation?.maxLength;
    if (min && value.length < min) return `Use at least ${min} characters.`;
    if (max && value.length > max) return `Use ${max} characters or fewer.`;
    return '';
  };

  const goNext = async () => {
    if (!current) return;
    const message = validate(current);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step < fields.length - 1) {
      setStep((index) => index + 1);
      return;
    }
    await submit();
  };

  const submit = async () => {
    setSaving(true);
    try {
      const body = new FormData();
      body.append('answers', JSON.stringify(values));
      body.append('website', honeypot);
      Object.entries(files).forEach(([key, file]) => body.append(key, file));
      await axios.post(`${API_BASE_URL}/api/public/forms/${slug}`, body);
      setPhase('done');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  return (
    <div className="gift-shell" style={themeVars}>
      <div className="gift-glow" />
      {phase === 'form' && (
        <div className="gift-progress">
          <div className="gift-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
      <header className="gift-top">
        <span className="gift-from">{meta.name || 'Form'}</span>
      </header>
      {missing && (
        <main className="gift-stage">
          <h1 className="gift-hero-title">This form is not available</h1>
          <p className="gift-hero-copy">It may still be a draft, or the link is wrong.</p>
        </main>
      )}
      {!missing && phase === 'intro' && (
        <main className="gift-stage">
          <h1 className="gift-hero-title">{meta.introTitle || 'Tell us a little about you'}</h1>
          <p className="gift-hero-copy">{meta.introBody}</p>
          <button className="gift-cta" type="button" disabled={!fields.length} onClick={() => setPhase('form')}>
            Start
          </button>
        </main>
      )}
      {!missing && phase === 'form' && current && (
        <main className="gift-stage gift-stage-field">
          <p className="gift-kicker">
            {step + 1} of {fields.length}
          </p>
          <h1 className="gift-question">{current.label}</h1>
          {current.hint && <p className="gift-hint">{current.hint}</p>}
          <FieldControl
            field={current}
            value={values[current.fieldKey] || ''}
            file={files[current.fieldKey]}
            onChange={(value) => setValue(current.fieldKey, value)}
            onFile={(file) => {
              setFiles((prev) => ({ ...prev, [current.fieldKey]: file }));
              if (error) setError('');
            }}
            onEnter={() => void goNext()}
          />
          <input className="gift-honeypot" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} aria-hidden="true" />
          {error && <p className="gift-error">{error}</p>}
          <div className="gift-actions">
            <button
              className="gift-back"
              type="button"
              disabled={saving}
              onClick={() => {
                setError('');
                if (step === 0) setPhase('intro');
                else setStep((index) => index - 1);
              }}
            >
              Back
            </button>
            {!current.isRequired && current.fieldType !== 'youtube' && (
              <button
                className="gift-skip"
                type="button"
                disabled={saving}
                onClick={() => {
                  setError('');
                  if (step < fields.length - 1) setStep((index) => index + 1);
                  else void submit();
                }}
              >
                Skip
              </button>
            )}
            <button className="gift-cta" type="button" disabled={saving} onClick={() => void goNext()}>
              {saving ? 'Sending…' : step === fields.length - 1 ? meta.submitLabel : 'Continue'}
            </button>
          </div>
        </main>
      )}
      {phase === 'done' && (
        <main className="gift-stage">
          <div className="gift-done-icon" aria-hidden>✓</div>
          <h1 className="gift-hero-title">Received</h1>
          <p className="gift-hero-copy">Thanks. You can close this page.</p>
        </main>
      )}
    </div>
  );
};

const FieldControl: React.FC<{
  field: FieldDraft;
  value: string;
  file?: File;
  onChange: (value: string) => void;
  onFile: (file: File) => void;
  onEnter: () => void;
}> = ({ field, value, file, onChange, onFile, onEnter }) => {
  if (field.fieldType === 'state') {
    return (
      <GiftPicker
        searchable
        value={value}
        placeholder={field.placeholder || 'Search for your state'}
        searchPlaceholder="Search state or country"
        emptyHint="Type a state, province, or country."
        options={WORLD_STATES}
        onChange={onChange}
      />
    );
  }
  if (field.fieldType === 'country') {
    return (
      <GiftPicker
        searchable
        value={value}
        placeholder={field.placeholder || 'Search for your country'}
        searchPlaceholder="Search countries"
        emptyHint="Type a country name."
        options={WORLD_COUNTRIES.map((country) => ({ value: country, label: country }))}
        onChange={onChange}
      />
    );
  }
  if (field.fieldType === 'dropdown') {
    return (
      <GiftPicker
        searchable={field.options.length > 8}
        value={value}
        placeholder={field.placeholder || 'Select an option'}
        options={field.options.filter(Boolean).map((option) => ({ value: option, label: option }))}
        onChange={onChange}
      />
    );
  }
  if (field.fieldType === 'yesNo') {
    return (
      <GiftPicker
        value={value}
        placeholder="Select an option"
        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
        onChange={onChange}
      />
    );
  }
  if (field.fieldType === 'checkbox') {
    return (
      <label className="gift-consent">
        <input type="checkbox" checked={value === 'yes'} onChange={(event) => onChange(event.target.checked ? 'yes' : '')} />
        <span>Yes, I confirm</span>
      </label>
    );
  }
  if (field.fieldType === 'youtube') {
    const id = youtubeId(field.settings?.youtubeUrl || '');
    return id ? (
      <iframe className="gift-video" src={`https://www.youtube.com/embed/${id}`} title={field.label} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    ) : (
      <p className="gift-hint">This video is not available.</p>
    );
  }
  if (field.fieldType === 'document') {
    return (
      <>
        <input
          className="gift-file"
          type="file"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) onFile(next);
          }}
        />
        {file && <p className="gift-hint">{file.name}</p>}
      </>
    );
  }
  if (field.fieldType === 'note' || field.fieldType === 'address') {
    return (
      <textarea
        className="gift-textarea"
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  const inputType = field.fieldType === 'email' ? 'email' : field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text';
  return (
    <input
      className="gift-input"
      value={value}
      type={inputType}
      inputMode={field.fieldType === 'phone' || field.fieldType === 'postalCode' ? 'numeric' : field.fieldType === 'number' ? 'decimal' : undefined}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onEnter();
        }
      }}
    />
  );
};
