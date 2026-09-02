import { useEffect, useState } from 'react';
import { Bell, Clock, Mail, Plus, Repeat, Send, TestTube2, Trash2, Users, X } from 'lucide-react';

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
  useUpdateCampaign,
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

export function CampaignComposer({ onSent, onCancel, initialCampaign = null }) {
  const [name, setName] = useState(initialCampaign?.name || '');
  const [channel, setChannel] = useState(initialCampaign?.channel || 'push');
  const [audience, setAudience] = useState(initialCampaign?.audience || { preset: 'everyone', onlineOnly: false });

  const [push, setPush] = useState(
    initialCampaign?.push || { title: '', body: '', deepLink: '', sound: 'default' },
  );
  const [email, setEmail] = useState(
    initialCampaign?.email || { subject: '', preheader: '', html: '', templateId: '' },
  );

  const [repeat, setRepeat] = useState(() => {
    if (initialCampaign?.repeat) {
      const rep = initialCampaign.repeat;
      const times =
        Array.isArray(rep.times) && rep.times.length > 0
          ? rep.times
          : [{ hour: rep.hour ?? 9, minute: rep.minute ?? 0 }];
      const weekdays =
        Array.isArray(rep.weekdays) && rep.weekdays.length > 0
          ? rep.weekdays
          : [rep.weekday ?? 1];
      return {
        rule: rep.rule || 'none',
        times,
        weekdays,
        timezone: rep.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        isEnabled: rep.isEnabled !== false,
      };
    }
    return {
      rule: 'none',
      times: [{ hour: 8, minute: 0 }],
      weekdays: [1],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      isEnabled: true,
    };
  });

  const [draftCampaignId, setDraftCampaignId] = useState(initialCampaign?._id || null);
  const [testEmail, setTestEmail] = useState('');

  const { data: templates } = useEmailTemplates();
  const previewAudience = usePreviewAudience();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
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

  function addTimeSlot() {
    setRepeat((cur) => ({
      ...cur,
      times: [...(cur.times || []), { hour: 17, minute: 0 }],
    }));
  }

  function removeTimeSlot(index) {
    setRepeat((cur) => ({
      ...cur,
      times: cur.times.filter((_, i) => i !== index),
    }));
  }

  function updateTimeSlot(index, hour, minute) {
    setRepeat((cur) => {
      const copy = [...(cur.times || [{ hour: 8, minute: 0 }])];
      copy[index] = { hour, minute };
      return { ...cur, times: copy };
    });
  }

  function toggleWeekday(dayIndex) {
    setRepeat((cur) => {
      const days = cur.weekdays || [1];
      const has = days.includes(dayIndex);
      const next = has
        ? days.length > 1
          ? days.filter((d) => d !== dayIndex)
          : days
        : [...days, dayIndex].sort();
      return { ...cur, weekdays: next, weekday: next[0] };
    });
  }

  async function handleSaveDraft() {
    const formattedRepeat =
      repeat.rule !== 'none'
        ? {
            rule: repeat.rule,
            times: repeat.times,
            hour: repeat.times[0]?.hour ?? 8,
            minute: repeat.times[0]?.minute ?? 0,
            weekdays: repeat.weekdays,
            weekday: repeat.weekdays[0] ?? 1,
            timezone: repeat.timezone,
            isEnabled: repeat.isEnabled,
          }
        : undefined;

    const payload = {
      name: name.trim(),
      channel,
      audience,
      ...(sendsPush ? { push } : {}),
      ...(sendsEmail
        ? { email: { subject: email.subject, preheader: email.preheader, html: email.html } }
        : {}),
      ...(formattedRepeat ? { repeat: formattedRepeat } : {}),
    };

    if (draftCampaignId) {
      const updated = await updateCampaign.mutateAsync({ campaignId: draftCampaignId, ...payload });
      onSent?.(updated);
      return updated;
    }

    const campaign = await createCampaign.mutateAsync(payload);
    setDraftCampaignId(campaign._id);
    onSent?.(campaign);
    return campaign;
  }

  async function handleSend() {
    const campaignId = draftCampaignId ?? (await handleSaveDraft())._id;
    await sendCampaign.mutateAsync({ campaignId });

    setDraftCampaignId(null);
    setName('');
    setRepeat((current) => ({ ...current, rule: 'none' }));
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
          <CardHeader
            title="When to send"
            description="Send once now, or set it running on a schedule with multiple timings."
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: 'none', label: 'Send once', hint: 'Goes out when you press send.' },
                { value: 'daily', label: 'Every day', hint: 'Configurable times (e.g. 8 AM & 5 PM).' },
                { value: 'weekly', label: 'Weekly', hint: 'Selected days and times.' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRepeat((current) => ({ ...current, rule: option.value }))}
                  className={`rounded-xl border px-3.5 py-2.5 text-left transition
                              ${
                                repeat.rule === option.value
                                  ? 'border-brand-400 bg-brand-50'
                                  : 'border-ink-300 hover:bg-ink-50'
                              }`}
                >
                  <span
                    className={`block text-sm ${
                      repeat.rule === option.value ? 'font-medium text-brand-700' : 'text-ink-800'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-xs text-ink-500">{option.hint}</span>
                </button>
              ))}
            </div>

            {repeat.rule !== 'none' && (
              <div className="space-y-4 border-t border-ink-200/70 pt-4">
                {repeat.rule === 'weekly' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                      Select Days of the Week
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Sun', value: 0 },
                        { label: 'Mon', value: 1 },
                        { label: 'Tue', value: 2 },
                        { label: 'Wed', value: 3 },
                        { label: 'Thu', value: 4 },
                        { label: 'Fri', value: 5 },
                        { label: 'Sat', value: 6 },
                      ].map((d) => {
                        const selected = repeat.weekdays?.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleWeekday(d.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              selected
                                ? 'bg-brand-500 text-white shadow-sm'
                                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Multiple Time Slots */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink-700">
                      Send Timings (Add morning, evening, or multiple slots)
                    </label>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Timing
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {repeat.times?.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white p-2"
                      >
                        <Clock className="h-4 w-4 text-ink-400" />
                        <input
                          type="time"
                          value={`${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(':').map(Number);
                            updateTimeSlot(index, h, m);
                          }}
                          className="flex-1 rounded-lg border-0 bg-transparent text-xs font-bold text-ink-900 focus:outline-none"
                        />
                        {repeat.times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="rounded p-1 text-ink-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="max-w-xs">
                  <Field label="Timezone" hint="The times above are local to this zone.">
                    <Select
                      value={repeat.timezone}
                      onChange={(event) =>
                        setRepeat((current) => ({ ...current, timezone: event.target.value }))
                      }
                    >
                      {['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'UTC'].map(
                        (zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ),
                      )}
                    </Select>
                  </Field>
                </div>
              </div>
            )}
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
                    setAudience((current) => ({
                      ...current,
                      gender: event.target.value ? event.target.value : null,
                    }))
                  }
                >
                  <option value="">All genders</option>
                  <option value="male">Boys only</option>
                  <option value="female">Girls only</option>
                </Select>
              </Field>

              <Field
                label="Activity"
                hint="Filter users who are currently connected or have been inactive."
              >
                <Select
                  value={
                    audience.onlineOnly
                      ? 'online'
                      : audience.inactiveForDays
                        ? String(audience.inactiveForDays)
                        : ''
                  }
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === 'online') {
                      setAudience((cur) => ({ ...cur, onlineOnly: true, inactiveForDays: null }));
                    } else if (val) {
                      setAudience((cur) => ({ ...cur, onlineOnly: false, inactiveForDays: Number(val) }));
                    } else {
                      setAudience((cur) => ({ ...cur, onlineOnly: false, inactiveForDays: null }));
                    }
                  }}
                >
                  <option value="">Any activity status</option>
                  <option value="online">Online right now</option>
                  <option value="7">Inactive for 7+ days</option>
                  <option value="30">Inactive for 30+ days</option>
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>

        {sendsPush && (
          <Card>
            <CardHeader
              title="Push notification"
              description="Keep it short. The body appears on lock screens and in notification centres."
            />
            <CardBody className="space-y-4">
              <Field label="Title" hint="The bold first line. Max 100 characters.">
                <Input
                  value={push.title}
                  onChange={(event) => setPush((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. Free coins waiting for you"
                  maxLength={100}
                />
              </Field>

              <Field label="Message body">
                <Textarea
                  value={push.body}
                  onChange={(event) => setPush((current) => ({ ...current, body: event.target.value }))}
                  placeholder="e.g. Open Vibe tonight and get 50 bonus coins."
                  rows={3}
                  maxLength={300}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Deep link" hint="Optional screen to open in app.">
                  <Input
                    value={push.deepLink}
                    onChange={(event) =>
                      setPush((current) => ({ ...current, deepLink: event.target.value }))
                    }
                    placeholder="e.g. coins, settings"
                  />
                </Field>
              </div>
            </CardBody>
          </Card>
        )}

        {sendsEmail && (
          <Card>
            <CardHeader
              title="Promotional email"
              description="Choose a pre-made template or write your own custom body."
            />
            <CardBody className="space-y-4">
              <Field label="Template">
                <Select
                  value={email.templateId ?? ''}
                  onChange={(event) => applyTemplate(event.target.value)}
                >
                  <option value="">Custom email (no template)</option>
                  {templates?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Subject line">
                <Input
                  value={email.subject}
                  onChange={(event) => setEmail((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="e.g. Special offer for {{nickname}}"
                  maxLength={200}
                />
              </Field>

              <Field label="Preheader (preview text)">
                <Input
                  value={email.preheader}
                  onChange={(event) => setEmail((current) => ({ ...current, preheader: event.target.value }))}
                  placeholder="e.g. Claim your weekend coins now"
                  maxLength={200}
                />
              </Field>

              <Field label="HTML body">
                <Textarea
                  value={email.html}
                  onChange={(event) => setEmail((current) => ({ ...current, html: event.target.value }))}
                  placeholder="<p>Hi {{nickname}}, your balance is {{coinBalance}} coins!</p>"
                  rows={8}
                />
              </Field>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Right Sidebar: Audience Summary, Preview & Actions */}
      <div className="space-y-5">
        <Card>
          <CardHeader title="Estimated Audience" />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">Matching Accounts</span>
              <span className="font-bold text-ink-900">
                {previewAudience.isPending ? <Spinner size="sm" /> : formatNumber(preview?.total ?? 0)}
              </span>
            </div>

            {sendsPush && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">Active Push Tokens</span>
                <span className="font-semibold text-emerald-600">
                  {formatNumber(preview?.reach?.pushDevices ?? 0)}
                </span>
              </div>
            )}

            {sendsEmail && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">Email Reachable</span>
                <span className="font-semibold text-indigo-600">
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
              isLoading={sendCampaign.isPending || createCampaign.isPending || updateCampaign.isPending}
              onClick={handleSend}
            >
              {initialCampaign
                ? 'Save & Send Now'
                : repeat.rule === 'none'
                  ? `Send to ${formatNumber(preview?.total ?? 0)} people`
                  : `Start ${repeat.rule} schedule`}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              disabled={!isValid}
              isLoading={createCampaign.isPending || updateCampaign.isPending}
              onClick={handleSaveDraft}
            >
              {initialCampaign ? 'Save Changes' : 'Save as draft'}
            </Button>

            {onCancel && (
              <Button
                variant="secondary"
                className="w-full text-red-600 hover:bg-red-50"
                onClick={onCancel}
              >
                Cancel Edit
              </Button>
            )}

            <p className="text-center text-xs text-ink-500">
              {repeat.rule === 'none'
                ? 'Sending starts immediately and cannot be undone once a message has left.'
                : 'The campaign will dispatch automatically at the configured time slots.'}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export { AUDIENCE_PRESETS };
