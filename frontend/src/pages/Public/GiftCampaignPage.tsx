import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './GiftCampaignPage.css';

import { API_BASE_URL } from '../../api/apiBase';
import { GiftPicker } from '../../components/GiftPicker';
import { WORLD_STATES } from '../../data/worldStates';
import {
  DEFAULT_GIFT_APPEARANCE,
  giftThemeCssVars,
  resolveGiftAppearance,
  type GiftAppearance,
} from './giftFormThemes';

const PLATFORMS = [
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'youtube',
  'whatsapp',
  'google',
  'website',
] as const;

type FieldKey =
  | 'fullName'
  | 'phone'
  | 'email'
  | 'address'
  | 'city'
  | 'state'
  | 'pincode'
  | 'productInterest'
  | 'jobInterest'
  | 'jobRole';

interface Step {
  key: FieldKey;
  eyebrow: string;
  title: string;
  hint: string;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  type?: string;
  optional?: boolean;
  skippable?: boolean;
  autoComplete?: string;
  example?: string;
  kind?: 'text' | 'job' | 'state';
}

const JOB_ROLES = [
  'Social Media Manager',
  'Content Creator',
  'Graphic Designer',
  'Video Editor',
  'Digital Marketing',
  'Performance Marketing',
  'SEO Specialist',
  'Software Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile App Developer',
  'UI / UX Designer',
  'Product Manager',
  'Sales Executive',
  'Business Development',
  'Telecaller',
  'Lead Verification Agent',
  'Customer Support',
  'Operations',
  'HR / Recruiter',
  'Partnerships',
  'Data Analyst',
  'Other',
];

const JOB_INTEREST_OPTIONS = [
  { value: 'yes', label: 'Yes, I’d like to work with you' },
  { value: 'maybe', label: 'Maybe later' },
  { value: 'no', label: 'No, not right now' },
];

const STEPS: Step[] = [
  {
    key: 'fullName',
    eyebrow: 'Let’s start',
    title: 'What’s your name?',
    hint: 'We’ll print this on your gift card.',
    placeholder: 'Full name',
    autoComplete: 'name',
  },
  {
    key: 'phone',
    eyebrow: 'Stay in touch',
    title: 'Your mobile number?',
    hint: '10-digit number. We’ll confirm delivery on WhatsApp.',
    placeholder: '9876543210',
    inputMode: 'numeric',
    autoComplete: 'tel',
  },
  {
    key: 'email',
    eyebrow: 'Updates',
    title: 'Where should we email you?',
    hint: 'Gift confirmation and tracking go here.',
    placeholder: 'you@email.com',
    type: 'email',
    autoComplete: 'email',
  },
  {
    key: 'address',
    eyebrow: 'Delivery',
    title: 'Where should we send the gift?',
    hint: 'House / street / landmark so the courier can find you.',
    placeholder: 'Flat, street, area',
    autoComplete: 'street-address',
  },
  {
    key: 'city',
    eyebrow: 'Delivery',
    title: 'Which city?',
    hint: 'City or town for shipping.',
    placeholder: 'Ahmedabad',
    autoComplete: 'address-level2',
  },
  {
    key: 'state',
    eyebrow: 'Delivery',
    title: 'Which state or region?',
    hint: 'Search by state or country. The list covers regions worldwide, so it is not limited to India.',
    placeholder: 'Search for your state',
    kind: 'state',
    autoComplete: 'address-level1',
  },
  {
    key: 'pincode',
    eyebrow: 'Delivery',
    title: 'Your pincode?',
    hint: '6-digit PIN so we pick the right courier.',
    placeholder: '380001',
    inputMode: 'numeric',
    autoComplete: 'postal-code',
  },
  {
    key: 'productInterest',
    eyebrow: 'Almost done',
    title: 'What are you interested in?',
    hint: 'Optional. Add a short note so we know what to follow up on.',
    example: 'Write it in your own words. Example: “Home solar for a 2BHK” or “Health insurance for my parents.” A sentence is enough.',
    placeholder: 'What you want, in a sentence',
    optional: true,
    skippable: true,
  },
  {
    key: 'jobInterest',
    eyebrow: 'Work with us',
    title: 'Would you like to work with us?',
    hint: 'Optional — skip if you only want the gift. We’re looking for people in marketing, tech, sales, and operations.',
    placeholder: 'Select an option',
    kind: 'job',
    optional: true,
    skippable: true,
  },
];

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const readSubmitError = (e: unknown) => {
  const data = (e as { response?: { data?: Record<string, unknown> } }).response?.data;
  if (!data) return 'Could not submit. Please try again.';
  if (typeof data.error === 'string' && data.error) return data.error;
  const errors = data.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, unknown>).flat()[0];
    if (typeof first === 'string') return first;
  }
  if (typeof data.title === 'string') return data.title;
  return 'Could not submit. Please try again.';
};

const resolvePlatform = (param?: string, search?: URLSearchParams) => {
  const raw =
    param ||
    search?.get('src') ||
    search?.get('utm_source') ||
    search?.get('from') ||
    'other';
  return raw.trim().toLowerCase().replace(/\s+/g, '');
};

/** Replace this draft with your final Privacy Policy when ready. */
const PRIVACY_POLICY = {
  lastUpdated: 'To be updated',
  companyName: '[Your company name]',
  contactEmail: '[privacy@example.com]',
  sections: [
    {
      title: 'What we collect',
      body: 'When you claim a gift, we collect your name, mobile number, email, delivery address, city, state, pincode, optional product interest, and whether you want to work with us (including the role you choose). We also store which campaign or platform you came from.',
    },
    {
      title: 'How we use it',
      body: 'We use this information only to send your gift, confirm delivery, and follow up about the gift or related offers you may have shown interest in. We do not sell your personal details.',
    },
    {
      title: 'Who we share it with',
      body: 'We may share your address and phone with courier or logistics partners only to deliver the gift. We do not share your data with unrelated third parties for their marketing.',
    },
    {
      title: 'How long we keep it',
      body: 'We keep your details for as long as needed to deliver the gift, handle queries, and meet legal record-keeping requirements, then delete or anonymise them.',
    },
    {
      title: 'Your choices',
      body: 'You can ask to see, correct, or delete your information, or withdraw consent for follow-ups, by emailing the contact below. Delivery-related contact may still be needed until the gift is delivered.',
    },
    {
      title: 'Contact',
      body: 'For privacy questions, email [privacy@example.com]. Replace this draft with your lawyer-approved Privacy Policy before public launch.',
    },
  ],
};

export const GiftCampaignPage: React.FC = () => {
  const { platform: routePlatform } = useParams();
  const [searchParams] = useSearchParams();
  const platform = useMemo(() => resolvePlatform(routePlatform, searchParams), [routePlatform, searchParams]);
  const [phase, setPhase] = useState<'intro' | 'form' | 'done'>('intro');
  const [step, setStep] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    productInterest: '',
    jobInterest: '',
    jobRole: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [appearance, setAppearance] = useState<GiftAppearance>(DEFAULT_GIFT_APPEARANCE);
  const inputRef = useRef<HTMLInputElement>(null);
  const themeVars = useMemo(() => giftThemeCssVars(appearance), [appearance]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Claim your gift';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_BASE_URL}/api/public/campaign/appearance`)
      .then((res) => {
        const payload = (res.data?.data ?? res.data) as Partial<GiftAppearance>;
        if (!cancelled) setAppearance(resolveGiftAppearance(payload));
      })
      .catch(() => {
        if (!cancelled) setAppearance(DEFAULT_GIFT_APPEARANCE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase === 'form') {
      const t = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(t);
    }
  }, [phase, step]);

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const validate = (key: FieldKey, value: string) => {
    const v = value.trim();
    switch (key) {
      case 'fullName':
        return v.length >= 2 ? '' : 'Please enter your full name.';
      case 'phone':
        return /^[6-9]\d{9}$/.test(normalizePhone(v)) ? '' : 'Enter a valid 10-digit Indian mobile number.';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.';
      case 'address':
        return v.length >= 5 ? '' : 'Add a complete delivery address.';
      case 'city':
        return v.length >= 2 ? '' : 'Enter your city.';
      case 'state':
        return v.length >= 2 ? '' : 'Search and choose your state or region.';
      case 'pincode':
        return /^\d{6}$/.test(v) ? '' : 'Enter a 6-digit pincode.';
      case 'jobInterest':
        return '';
      default:
        return '';
    }
  };

  const goNext = async () => {
    const msg = current.optional ? '' : validate(current.key, values[current.key]);
    if (msg) {
      setError(msg);
      return;
    }
    if (step === STEPS.length - 1 && !acceptedPrivacy) {
      setError('Please read and accept the Privacy Policy to continue.');
      return;
    }
    setError('');
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    await submit();
  };

  const skip = async () => {
    if (current.key === 'productInterest') {
      setValues((prev) => ({ ...prev, productInterest: '' }));
    }
    if (current.kind === 'job') {
      setValues((prev) => ({ ...prev, jobInterest: '', jobRole: '' }));
    }
    if (step === STEPS.length - 1 && !acceptedPrivacy) {
      setError('Please read and accept the Privacy Policy to continue.');
      return;
    }
    setError('');
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    await submit();
  };

  const goBack = () => {
    setError('');
    if (step === 0) {
      setPhase('intro');
      return;
    }
    setStep((s) => s - 1);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/public/campaign/leads`,
        {
          fullName: values.fullName.trim(),
          phone: normalizePhone(values.phone),
          email: values.email.trim(),
          address: values.address.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          pincode: values.pincode.trim(),
          productInterest: values.productInterest.trim() || null,
          jobInterest: values.jobInterest || null,
          jobRole: values.jobInterest === 'yes' || values.jobInterest === 'maybe' ? values.jobRole || null : null,
          platform,
          campaign: searchParams.get('campaign') || 'Gift Campaign',
          website: honeypot,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setPhase('done');
    } catch (e: unknown) {
      setError(readSubmitError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gift-shell" data-theme={appearance.themeKey} style={themeVars}>
      <div className="gift-glow" />
      {phase === 'form' && (
        <div className="gift-progress">
          <div className="gift-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <header className="gift-top">
        <span className="gift-from">Gift claim</span>
        <button className="gift-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>
          Privacy Policy
        </button>
      </header>

      {phase === 'intro' && (
        <main className="gift-stage">
          <p className="gift-kicker">A little something for you</p>
          <h1 className="gift-hero-title">Claim your complimentary gift</h1>
          <p className="gift-hero-copy">
            Tell us where to send it. Takes about a minute — one question at a time, on your phone.
          </p>
          <ul className="gift-perks">
            <li>Name &amp; number to confirm</li>
            <li>Address for doorstep delivery</li>
            <li>No payment required</li>
          </ul>
          <button className="gift-cta" type="button" onClick={() => setPhase('form')}>
            Start
          </button>
          <p className="gift-privacy-note">
            By continuing you agree we may use your details to send the gift.{' '}
            <button className="gift-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>
              Read Privacy Policy
            </button>
          </p>
        </main>
      )}

      {phase === 'form' && (
        <main className="gift-stage gift-stage-field">
          <p className="gift-kicker">
            {current.eyebrow} · {step + 1} of {STEPS.length}
          </p>
          <h1 className="gift-question">{current.title}</h1>
          <p className="gift-hint">{current.hint}</p>
          {current.example && <p className="gift-example">{current.example}</p>}
          {current.kind === 'job' ? (
            <div className="gift-job">
              <GiftPicker
                value={values.jobInterest}
                placeholder="Select an option"
                options={JOB_INTEREST_OPTIONS}
                onChange={(next) => {
                  setValues((prev) => ({
                    ...prev,
                    jobInterest: next,
                    jobRole: next === 'no' ? '' : prev.jobRole,
                  }));
                  if (error) setError('');
                }}
              />
              {(values.jobInterest === 'yes' || values.jobInterest === 'maybe') && (
                <>
                  <p className="gift-job-label">Which role fits you best?</p>
                  <GiftPicker
                    searchable
                    value={values.jobRole}
                    placeholder="Select a role"
                    searchPlaceholder="Search roles"
                    options={JOB_ROLES.map((role) => ({ value: role, label: role }))}
                    onChange={(next) => {
                      setValues((prev) => ({ ...prev, jobRole: next }));
                      if (error) setError('');
                    }}
                  />
                </>
              )}
            </div>
          ) : current.kind === 'state' ? (
            <GiftPicker
              searchable
              value={values.state}
              placeholder={current.placeholder}
              searchPlaceholder="Search state or country"
              emptyHint="Type a state, province, or country — for example Gujarat, California, or India."
              options={WORLD_STATES}
              onChange={(next) => {
                setValues((prev) => ({ ...prev, state: next }));
                if (error) setError('');
              }}
            />
          ) : (
            <input
              ref={inputRef}
              className="gift-input"
              value={values[current.key]}
              type={current.type || 'text'}
              inputMode={current.inputMode}
              autoComplete={current.autoComplete}
              placeholder={current.placeholder}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [current.key]: e.target.value }));
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void goNext();
                }
              }}
            />
          )}
          <input
            className="gift-honeypot"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            aria-hidden="true"
          />
          {error && <p className="gift-error">{error}</p>}
          {step === STEPS.length - 1 && (
            <label className="gift-consent">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => {
                  setAcceptedPrivacy(e.target.checked);
                  if (error) setError('');
                }}
              />
              <span>
                I have read and accept the{' '}
                <button className="gift-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          )}
          <div className="gift-actions">
            <button className="gift-back" type="button" onClick={goBack} disabled={saving}>
              Back
            </button>
            {current.skippable && (
              <button className="gift-skip" type="button" onClick={() => void skip()} disabled={saving}>
                Skip
              </button>
            )}
            <button className="gift-cta" type="button" onClick={() => void goNext()} disabled={saving}>
              {saving ? 'Sending…' : step === STEPS.length - 1 ? 'Claim gift' : 'Continue'}
            </button>
          </div>
        </main>
      )}

      {phase === 'done' && (
        <main className="gift-stage">
          <div className="gift-done-icon" aria-hidden>
            ✓
          </div>
          <h1 className="gift-hero-title">You’re in</h1>
          <p className="gift-hero-copy">
            Thanks {values.fullName.split(' ')[0] || ''}. We’ll use this address to send your gift and may call {values.phone} to confirm.
          </p>
          <p className="gift-hint">You can close this page now.</p>
        </main>
      )}

      <p className="gift-legal">
        Your details are used to deliver the gift.{' '}
        <button className="gift-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>
          Privacy Policy
        </button>
      </p>

      {showPrivacy && (
        <div className="gift-privacy-overlay" role="dialog" aria-modal="true" aria-labelledby="gift-privacy-title">
          <div className="gift-privacy-sheet">
            <div className="gift-privacy-head">
              <h2 id="gift-privacy-title">Privacy Policy</h2>
              <button className="gift-privacy-close" type="button" onClick={() => setShowPrivacy(false)}>
                Close
              </button>
            </div>
            <p className="gift-privacy-meta">Draft — last updated: {PRIVACY_POLICY.lastUpdated}</p>
            {PRIVACY_POLICY.sections.map((section) => (
              <section key={section.title} className="gift-privacy-section">
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
            <p className="gift-privacy-meta">
              Contact: {PRIVACY_POLICY.contactEmail}. Company: {PRIVACY_POLICY.companyName}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const CAMPAIGN_PLATFORMS = PLATFORMS;
