import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { CopyOutlined, GiftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import '../Public/GiftCampaignPage.css';
import './AdvertiseLeadFormPage.css';
import {
  DEFAULT_GIFT_APPEARANCE,
  GIFT_THEME_PRESETS,
  giftThemeCssVars,
  resolveGiftAppearance,
  type GiftAppearance,
  type GiftThemeKey,
} from '../Public/giftFormThemes';

const { Title, Paragraph, Text } = Typography;

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'google', label: 'Google' },
  { id: 'website', label: 'Website' },
];

const readAppearance = (payload: unknown): GiftAppearance => {
  const root = payload as Record<string, unknown> | undefined;
  const data = (root?.data ?? root) as Partial<GiftAppearance> | undefined;
  return resolveGiftAppearance(data);
};

const readApiError = (err: unknown) => {
  const ax = err as {
    message?: string;
    code?: string;
    response?: { status?: number; data?: { error?: string; title?: string } };
  };
  if (ax.response?.data?.error) return ax.response.data.error;
  if (ax.response?.status === 404) {
    return 'The API does not have this endpoint yet. Restart BTN.API so the new code and migration load.';
  }
  if (!ax.response) {
    return 'Cannot reach the API. Start BTN.API (dotnet run in backend/src/BTN.API), then try again.';
  }
  return ax.response.data?.title || ax.message || `Request failed (${ax.response.status})`;
};

export const AdvertiseLeadFormPage: React.FC = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const feedback = useFeedback();
  const [copied, setCopied] = useState('');
  const [draft, setDraft] = useState<GiftAppearance>(DEFAULT_GIFT_APPEARANCE);
  const [saved, setSaved] = useState<GiftAppearance>(DEFAULT_GIFT_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const resolvedDraft = useMemo(() => resolveGiftAppearance(draft), [draft]);
  const previewVars = useMemo(() => giftThemeCssVars(resolvedDraft), [resolvedDraft]);
  const dirty =
    draft.themeKey !== saved.themeKey ||
    draft.backgroundColor !== saved.backgroundColor ||
    draft.accentColor !== saved.accentColor ||
    draft.ctaColor !== saved.ctaColor;

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/api/campaign-form-appearance')
      .then((res) => {
        const next = readAppearance(res.data);
        if (!cancelled) {
          setDraft(next);
          setSaved(next);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          feedback.error('Could not load form look', readApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [feedback]);

  const links = useMemo(
    () =>
      PLATFORMS.map((p) => ({
        ...p,
        url: `${origin}/gift/${p.id}?campaign=BTN%20Gift%20Campaign`,
      })),
    [origin]
  );

  const copy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    message.success('Link copied — paste it in your bio or story');
  };

  const selectTheme = (key: GiftThemeKey) => {
    if (key === 'custom') {
      setDraft((prev) => ({
        themeKey: 'custom',
        backgroundColor: prev.backgroundColor,
        accentColor: prev.accentColor,
        ctaColor: prev.ctaColor,
      }));
      return;
    }
    const preset = GIFT_THEME_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setDraft({
      themeKey: preset.key,
      backgroundColor: preset.background,
      accentColor: preset.accent,
      ctaColor: preset.cta,
    });
  };

  const saveLook = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.put('/api/campaign-form-appearance', resolvedDraft);
      const next = readAppearance(res.data);
      setDraft(next);
      setSaved(next);
      message.success('Gift form look saved. Customers will see this on /gift.');
    } catch (err: unknown) {
      feedback.error('Could not save form look', readApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Space align="start" size={12} style={{ marginBottom: 8 }}>
        <GiftOutlined style={{ fontSize: 22 }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Gift campaign form
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            Public, mobile-first form (one question per screen). Attach a platform link on Instagram, Twitter, or
            WhatsApp. Submissions appear under Gift submissions, with the platform saved for filtering.
          </Paragraph>
        </div>
      </Space>

      <Title level={5} style={{ marginTop: 8 }}>
        Form look
      </Title>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        Only you can change this. Customers on /gift always see the last saved look — not a draft.
      </Paragraph>

      <div className="gift-theme-grid">
        {GIFT_THEME_PRESETS.map((preset) => {
          const selected = draft.themeKey === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              className={`gift-theme-card${selected ? ' is-selected' : ''}`}
              onClick={() => selectTheme(preset.key)}
              disabled={loading}
            >
              <span className="gift-theme-swatches" aria-hidden>
                <span style={{ background: preset.background }} />
                <span style={{ background: preset.accent }} />
                <span style={{ background: preset.cta }} />
              </span>
              <strong>{preset.name}</strong>
              <span>{preset.blurb}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`gift-theme-card${draft.themeKey === 'custom' ? ' is-selected' : ''}`}
          onClick={() => selectTheme('custom')}
          disabled={loading}
        >
          <span className="gift-theme-swatches" aria-hidden>
            <span style={{ background: draft.backgroundColor }} />
            <span style={{ background: draft.accentColor }} />
            <span style={{ background: draft.ctaColor }} />
          </span>
          <strong>Custom</strong>
          <span>Pick background, accent, and button colors for your brand.</span>
        </button>
      </div>

      {draft.themeKey === 'custom' && (
        <div className="gift-theme-custom">
          <label>
            Background
            <input
              type="color"
              value={resolvedDraft.backgroundColor}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, themeKey: 'custom', backgroundColor: e.target.value }))
              }
            />
          </label>
          <label>
            Accent
            <input
              type="color"
              value={resolvedDraft.accentColor}
              onChange={(e) => setDraft((prev) => ({ ...prev, themeKey: 'custom', accentColor: e.target.value }))}
            />
          </label>
          <label>
            Button
            <input
              type="color"
              value={resolvedDraft.ctaColor}
              onChange={(e) => setDraft((prev) => ({ ...prev, themeKey: 'custom', ctaColor: e.target.value }))}
            />
          </label>
        </div>
      )}

      <div className="gift-shell gift-theme-preview" data-theme={resolvedDraft.themeKey} style={previewVars}>
        <div className="gift-glow" />
        <p className="gift-kicker">Live preview</p>
        <h1 className="gift-hero-title">Claim your complimentary gift</h1>
        <p className="gift-hero-copy">Tell us where to send it. Takes about a minute.</p>
        <button className="gift-cta" type="button">
          Start
        </button>
      </div>

      <Space style={{ marginTop: 16 }} wrap>
        <Button type="primary" onClick={() => void saveLook()} loading={saving} disabled={loading || !dirty}>
          Save look
        </Button>
        <Button href="/gift" target="_blank">
          Preview form
        </Button>
        {dirty ? (
          <Text type="warning">Unsaved — customers still see the previous look.</Text>
        ) : (
          <Text type="secondary">Saved look is live on /gift.</Text>
        )}
      </Space>

      <Paragraph style={{ marginTop: 28 }}>
        Base link:{' '}
        <Text code copyable>
          {origin}/gift
        </Text>
      </Paragraph>
      <Paragraph type="secondary">
        Add <Text code>?src=instagram</Text> or use <Text code>/gift/instagram</Text>. Also accepts{' '}
        <Text code>utm_source</Text> and <Text code>campaign</Text>.
      </Paragraph>

      <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 8 }}>
        {links.map((link) => (
          <Input
            key={link.id}
            value={link.url}
            readOnly
            addonBefore={link.label}
            addonAfter={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => void copy(link.url, link.id)}
              >
                {copied === link.id ? 'Copied' : 'Copy'}
              </Button>
            }
          />
        ))}
      </Space>

      <Space style={{ marginTop: 20 }}>
        <Button type="primary" href="/gift/instagram" target="_blank">
          Preview Instagram form
        </Button>
        <Link to="/campaign/submissions">
          <Button>View submissions</Button>
        </Link>
      </Space>
    </Card>
  );
};
