import { useEffect, useState } from 'react';
import { Bell, Mail, Send, TestTube2, Users } from 'lucide-react';

import { Button } from './ui/Button.jsx';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Field, Input, NumberInput, Select, Textarea, Toggle } from './ui/Field.jsx';
import { Spinner } from './ui/Feedback.jsx';
import { formatNumber } from '../lib/format.js';
import {
  useCreateCampaign,
  useEmailTemplates,
  usePreviewAudience,
  useSendCampaign,
  useSendTestEmail,
} from '../hooks/queries.js';

const AUDIENCE_PRESETS = [
  { value: 'everyone', label: 'Everyone', hint: 'All verified, active accounts.' },
  { value: 'boys', label: 'Boys only', hint: 'Male accounts.' },
  { value: 'girls', label: 'Girls only', hint: 'Female accounts.' },
  { value: 'online_now', label: 'Online right now', hint: 'Currently connected.' },
  { value: 'inactive_7_days', label: 'Not seen for a week', hint: 'Win-back audience.' },
  { value: 'never_purchased', label: 'Never bought coins', hint: 'Yet to convert.' },
  { value: 'paying_users', label: 'Has bought coins', hint: 'Your paying users.' },
  { value: 'low_balance', label: 'Nearly out of coins', hint: 'Ready for a top-up nudge.' },
];

const CHANNELS = [
  { value: 'push', label: 'Push only', icon: Bell },
  { value: 'email', label: 'Email only', icon: Mail },
  { value: 'both', label: 'Push and email', icon: Send },
];

/** Renders the campaign HTML in an isolated frame, exactly as an inbox would. */
function EmailPreview({ html, subject, preheader }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-3">
        <p className="truncate text-sm font-semibold text-ink-900">{subject || 'No subject yet'}</p>
        {preheader && <p className="truncate text-xs text-ink-500">{preheader}</p>}
      </div>
      {/*
        A sandboxed iframe, not dangerouslySetInnerHTML: campaign HTML is
        authored to run inside a mail client, and dropping it into this document
        would let its styles and any script escape into the admin panel.
      */}
      <iframe
        title="Email preview"
        sandbox=""
        srcDoc={html || '<p style="font-family:sans-serif;color:#999;padding:24px;">Nothing written yet.</p>'}
        className="h-80 w-full bg-white"
      />
    </div>
  );
}

function PushPreview({ title, body, appName = 'Vibe' }) {
  return (
    <div className="rounded-2xl bg-ink-900 p-4">
      <div className="rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="grid h-4 w-4 place-items-center rounded bg-brand-500 text-[8px] font-bold text-white">
            V
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{appName}</span>
          <span className="ml-auto text-[11px] text-ink-400">now</span>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-ink-900">{title || 'Notification title'}</p>
        <p className="line-clamp-2 text-xs text-ink-600">{body || 'Your message appears here.'}</p>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-ink-400">How it looks on a locked phone</p>
    </div>
  );
}

export function CampaignComposer({ onSent }) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('push');
  const [audience, setAudience] = useState({ preset: 'everyone', onlineOnly: false });

  const [push, setPush] = useState({ title: '', body: '', deepLink: '', sound: 'default' });
  const [email, setEmail] = useState({ subject: '', preheader: '', html: '', templateId: '' });

  const [draftCampaignId, setDraftCampaignId] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  const { data: templates } = useEmailTemplates();
  const previewAudience = usePreviewAudience();
  const createCampaign = useCreateCampaign();
  const sendCampaign = useSendCampaign();
  const sendTest = useSendTestEmail();

  const sendsPush = channel === 'push' || channel === 'both';
  const sendsEmail = channel === 'email' || channel === 'both';

  // Re-count whenever the targeting changes, so the number next to the send
  // button is never stale by the time it is pressed.
  useEffect(() => {
    const timer = setTimeout(() => previewAudience.mutate(audience), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience.preset, audience.gender, audience.onlineOnly, audience.inactiveForDays, audience.maxCoinBalance]);

  const preview = previewAudience.data;

  function applyTemplate(templateId) {
    const template = templates?.find((item) => item._id === templateId);
    if (!template) {
      setEmail((current) => ({ ...current, templateId: '' }));
      return;
    }

    setEmail({
      templateId,
      subject: template.subject,
      preheader: template.preheader ?? '',
      html: template.html,
    });
  }

  const isValid =
    name.trim().length >= 2 &&
    (!sendsPush || push.title.trim().length > 0) &&
    (!sendsEmail || (email.subject.trim().length > 0 && email.html.trim().length > 0));

  async function handleSaveDraft() {
    const payload = {
      name: name.trim(),
      channel,
      audience,
      ...(sendsPush ? { push } : {}),
      ...(sendsEmail
        ? { email: { subject: email.subject, preheader: email.preheader, html: email.html } }
        : {}),
    };

    const campaign = await createCampaign.mutateAsync(payload);
    setDraftCampaignId(campaign._id);
    return campaign;
  }

  async function handleSend() {
    // Save first if this has not been saved yet, so "send" is always one press.
    const campaignId = draftCampaignId ?? (await handleSaveDraft())._id;
    await sendCampaign.mutateAsync({ campaignId });

    setDraftCampaignId(null);
    setName('');
    setPush({ title: '', body: '', deepLink: '', sound: 'default' });
    setEmail({ subject: '', preheader: '', html: '', templateId: '' });
    onSent?.();
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Card>
          <CardHeader title="What are you sending?" />
          <CardBody className="space-y-4">
            <Field label="Campaign name" hint="Only you see this. It appears in the history below.">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Weekend coin offer"
                maxLength={100}
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Channel</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CHANNELS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChannel(option.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm transition
                                ${
                                  channel === option.value
                                    ? 'border-brand-400 bg-brand-50 font-medium text-brand-700'
                                    : 'border-ink-300 text-ink-600 hover:bg-ink-50'
                                }`}
                  >
                    <option.icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Who receives it" description="Pick a group, then narrow it if you need to." />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AUDIENCE_PRESETS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAudience((current) => ({ ...current, preset: option.value }))}
                  className={`rounded-xl border px-3.5 py-2.5 text-left transition
                              ${
                                audience.preset === option.value
                                  ? 'border-brand-400 bg-brand-50'
                                  : 'border-ink-300 hover:bg-ink-50'
                              }`}
                >
                  <span
                    className={`block text-sm ${
                      audience.preset === option.value ? 'font-medium text-brand-700' : 'text-ink-800'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-xs text-ink-500">{option.hint}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-ink-200/70 pt-4 sm:grid-cols-2">
              <Field label="Also limit to gender">
                <Select
                  value={audience.gender ?? ''}
                  onChange={(event) =>
                    setAudience((current) => ({ ...current, gender: event.target.value || null }))
                  }
                >
                  <option value="">No extra limit</option>
                  <option value="male">Boys</option>
                  <option value="female">Girls</option>
                </Select>
              </Field>

              <Field label="Coin balance at most" hint="Leave empty to ignore.">
                <NumberInput
                  value={audience.maxCoinBalance ?? ''}
                  min={0}
                  suffix="coins"
                  onChange={(event) =>
                    setAudience((current) => ({
                      ...current,
                      maxCoinBalance: event.target.value === '' ? null : Number(event.target.value),
                    }))
                  }
                />
              </Field>
            </div>

            <Toggle
              checked={audience.onlineOnly}
              onChange={(value) => setAudience((current) => ({ ...current, onlineOnly: value }))}
              label="Only people online right now"
            />
          </CardBody>
        </Card>

        {sendsPush && (
          <Card>
            <CardHeader title="Notification" description="Keep it short — phones truncate long text." />
            <CardBody className="space-y-4">
              <Field label="Title" hint={`${push.title.length}/100`}>
                <Input
                  value={push.title}
                  onChange={(event) => setPush((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. Double coins today"
                  maxLength={100}
                />
              </Field>

              <Field label="Message" hint={`${push.body.length}/300`}>
                <Textarea
                  rows={2}
                  value={push.body}
                  onChange={(event) => setPush((current) => ({ ...current, body: event.target.value }))}
                  placeholder="e.g. Every pack has 20% more coins until midnight."
                  maxLength={300}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Opens" hint="Which screen tapping it should open.">
                  <Select
                    value={push.deepLink}
                    onChange={(event) => setPush((current) => ({ ...current, deepLink: event.target.value }))}
                  >
                    <option value="">The home screen</option>
                    <option value="coins">Buy coins</option>
                    <option value="chats">Chats</option>
                    <option value="rooms">Rooms</option>
                    <option value="games">Games</option>
                  </Select>
                </Field>

                <Field label="Sound">
                  <Select
                    value={push.sound}
                    onChange={(event) => setPush((current) => ({ ...current, sound: event.target.value }))}
                  >
                    <option value="default">Default</option>
                    <option value="message.wav">Message chime</option>
                    <option value="coin.wav">Coin</option>
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>
        )}

        {sendsEmail && (
          <Card>
            <CardHeader
              title="Email"
              description="Start from a template, then edit the HTML. The unsubscribe footer is added automatically."
            />
            <CardBody className="space-y-4">
              <Field label="Start from a template">
                <Select value={email.templateId} onChange={(event) => applyTemplate(event.target.value)}>
                  <option value="">Write from scratch</option>
                  {templates?.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Subject" hint="Supports {{name}}.">
                <Input
                  value={email.subject}
                  onChange={(event) => setEmail((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="e.g. More coins, same price"
                  maxLength={200}
                />
              </Field>

              <Field label="Preview line" hint="Shown after the subject in most inboxes.">
                <Input
                  value={email.preheader}
                  onChange={(event) => setEmail((current) => ({ ...current, preheader: event.target.value }))}
                  maxLength={200}
                />
              </Field>

              <Field
                label="Body (HTML)"
                hint="Placeholders: {{name}}, {{nickname}}, {{coinBalance}}, {{appName}}. Use inline styles — email clients ignore stylesheets."
              >
                <Textarea
                  rows={10}
                  value={email.html}
                  onChange={(event) => setEmail((current) => ({ ...current, html: event.target.value }))}
                  className="font-mono text-xs"
                  placeholder="<p>Hi {{name}},</p>"
                />
              </Field>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader title="Reach" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
              <Users className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <span className="text-sm text-ink-600">People matched</span>
              <span className="ml-auto text-sm font-semibold text-ink-900">
                {previewAudience.isPending ? <Spinner className="h-4 w-4" /> : formatNumber(preview?.total ?? 0)}
              </span>
            </div>

            {sendsPush && (
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
                <Bell className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="text-sm text-ink-600">Devices reachable</span>
                <span className="ml-auto text-sm font-semibold text-ink-900">
                  {formatNumber(preview?.reach?.pushDevices ?? 0)}
                </span>
              </div>
            )}

            {sendsEmail && (
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="text-sm text-ink-600">Opted in to email</span>
                <span className="ml-auto text-sm font-semibold text-ink-900">
                  {formatNumber(preview?.reach?.emailOptedIn ?? 0)}
                </span>
              </div>
            )}

            {preview?.total === 0 && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                Nobody matches this audience yet. Widen it before sending.
              </p>
            )}
          </CardBody>
        </Card>

        {sendsPush && (
          <Card>
            <CardHeader title="Notification preview" />
            <CardBody>
              <PushPreview title={push.title} body={push.body} />
            </CardBody>
          </Card>
        )}

        {sendsEmail && (
          <Card>
            <CardHeader title="Email preview" />
            <CardBody className="space-y-3">
              <EmailPreview html={email.html} subject={email.subject} preheader={email.preheader} />

              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-label="Send a test to"
                />
                <Button
                  variant="outline"
                  icon={TestTube2}
                  disabled={!testEmail || !isValid}
                  isLoading={sendTest.isPending || createCampaign.isPending}
                  onClick={async () => {
                    const campaignId = draftCampaignId ?? (await handleSaveDraft())._id;
                    await sendTest.mutateAsync({ campaignId, toEmail: testEmail });
                  }}
                >
                  Test
                </Button>
              </div>
              <p className="text-xs text-ink-500">
                A test goes through exactly the same rendering as the real send.
              </p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="space-y-3">
            <Button
              size="lg"
              icon={Send}
              className="w-full"
              disabled={!isValid || !preview?.total}
              isLoading={sendCampaign.isPending || createCampaign.isPending}
              onClick={handleSend}
            >
              Send to {formatNumber(preview?.total ?? 0)} people
            </Button>

            <Button
              variant="outline"
              className="w-full"
              disabled={!isValid}
              isLoading={createCampaign.isPending}
              onClick={handleSaveDraft}
            >
              Save as draft
            </Button>

            <p className="text-center text-xs text-ink-500">
              Sending starts immediately and cannot be undone once a message has left.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export { AUDIENCE_PRESETS };
