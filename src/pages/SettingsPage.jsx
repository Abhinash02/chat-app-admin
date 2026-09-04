import { useState } from 'react';
import { Coins, Gamepad2, Gift, MessageSquare, MapPin, Radio, Save, ShieldAlert, Smartphone, Wallet } from 'lucide-react';

import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { Field, Input, NumberInput, Textarea, Toggle } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { useSettings, useUpdateSettings } from '../hooks/queries.js';

/**
 * Each section owns its own draft and Save button.
 *
 * One page-wide save would mean an operator fixing a UPI ID also re-submits
 * every unrelated value they happened to look at — and the PATCH is partial by
 * design, so keeping the granularity here matches how the API behaves.
 */
function SettingsSection({ icon: Icon, title, description, group, settings, children, transform }) {
  const saved = settings[group];

  const [draft, setDraft] = useState(saved);
  const [syncedWith, setSyncedWith] = useState(saved);
  const update = useUpdateSettings();

  // Adjusting state during render rather than in an effect: React re-renders
  // this component immediately with the new draft and never commits the stale
  // one, so a save from elsewhere cannot flash old values on screen.
  if (syncedWith !== saved) {
    setSyncedWith(saved);
    setDraft(saved);
  }

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
            {title}
          </span>
        }
        description={description}
        action={
          <Button
            size="sm"
            icon={Save}
            disabled={!hasChanges}
            isLoading={update.isPending}
            onClick={() => update.mutate({ [group]: transform ? transform(draft) : draft })}
          >
            Save
          </Button>
        }
      />
      <CardBody>{children({ draft, set })}</CardBody>
    </Card>
  );
}

export function SettingsPage() {
  const { data: settings, isLoading, error, refetch } = useSettings();

  if (isLoading) return <LoadingState label="Loading settings…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="How the app behaves. Every change is live immediately — no release required."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Chat Settings */}
        <SettingsSection
          icon={MessageSquare}
          title="Chat"
          description="Messaging behaviour and the automatic greeting."
          group="chat"
          settings={settings}
          transform={(draft) => ({
            maxMessageLength: Number(draft.maxMessageLength),
            autoGreetingText: draft.autoGreetingText,
            autoGreetingEnabled: draft.autoGreetingEnabled,
            heartbeatIntervalSeconds: Number(draft.heartbeatIntervalSeconds),
            typingIndicatorEnabled: draft.typingIndicatorEnabled,
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft.autoGreetingEnabled}
                onChange={(value) => set('autoGreetingEnabled', value)}
                label="Send a greeting automatically"
                description="Sent once when someone opens a brand-new chat by tapping a profile."
              />

              <Field label="Greeting text" hint="Kept short — it is a conversation opener, not a message.">
                <Input
                  value={draft.autoGreetingText ?? ''}
                  onChange={(event) => set('autoGreetingText', event.target.value)}
                  maxLength={200}
                  disabled={!draft.autoGreetingEnabled}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Longest message">
                  <NumberInput
                    value={draft.maxMessageLength}
                    min={1}
                    max={5000}
                    suffix="chars"
                    onChange={(event) => set('maxMessageLength', event.target.value)}
                  />
                </Field>

                <Field
                  label="Free-time tick"
                  hint="How often the app reports it is still chatting."
                >
                  <NumberInput
                    value={draft.heartbeatIntervalSeconds}
                    min={5}
                    max={120}
                    suffix="sec"
                    onChange={(event) => set('heartbeatIntervalSeconds', event.target.value)}
                  />
                </Field>
              </div>

              <Toggle
                checked={draft.typingIndicatorEnabled}
                onChange={(value) => set('typingIndicatorEnabled', value)}
                label="Show typing indicators"
              />
            </div>
          )}
        </SettingsSection>

        {/* Payments Settings */}
        <SettingsSection
          icon={Wallet}
          title="Payments"
          description="Where money arrives. The UPI details here are shown to buyers."
          group="payments"
          settings={settings}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft.razorpayEnabled}
                onChange={(value) => set('razorpayEnabled', value)}
                label="Card and UPI checkout (Razorpay)"
                description="Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set on the server."
              />

              <Toggle
                checked={draft.manualUpiEnabled}
                onChange={(value) => set('manualUpiEnabled', value)}
                label="Direct UPI transfer"
                description="Buyers pay your UPI ID and submit the reference. You confirm it on the Payments page."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="UPI ID" hint="Works with GPay, PhonePe, Paytm and any UPI app.">
                  <Input
                    value={draft.upiId ?? ''}
                    onChange={(event) => set('upiId', event.target.value)}
                    placeholder="yourname@bank"
                    disabled={!draft.manualUpiEnabled}
                  />
                </Field>

                <Field label="Payee name" hint="Shown in the buyer's payment app.">
                  <Input
                    value={draft.upiPayeeName ?? ''}
                    onChange={(event) => set('upiPayeeName', event.target.value)}
                    disabled={!draft.manualUpiEnabled}
                  />
                </Field>
              </div>

              <Field
                label="QR code image URL"
                hint="Optional. The app also generates a UPI link from the ID above, so a QR is not required."
              >
                <Input
                  value={draft.upiQrImageUrl ?? ''}
                  onChange={(event) => set('upiQrImageUrl', event.target.value)}
                  placeholder="https://…"
                  disabled={!draft.manualUpiEnabled}
                />
              </Field>

              <Field label="Support email" hint="Shown to buyers if a payment goes wrong.">
                <Input
                  type="email"
                  value={draft.supportEmail ?? ''}
                  onChange={(event) => set('supportEmail', event.target.value)}
                />
              </Field>
            </div>
          )}
        </SettingsSection>

        {/* Discovery Settings */}
        <SettingsSection
          icon={MapPin}
          title="Discovery"
          description="How people find each other."
          group="discovery"
          settings={settings}
          transform={(draft) => ({
            defaultRadiusKm: Number(draft.defaultRadiusKm),
            maxRadiusKm: Number(draft.maxRadiusKm),
            showDistance: draft.showDistance,
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Default radius">
                  <NumberInput
                    value={draft.defaultRadiusKm}
                    min={1}
                    max={500}
                    suffix="km"
                    onChange={(event) => set('defaultRadiusKm', event.target.value)}
                  />
                </Field>

                <Field label="Maximum radius" hint="Caps how far anyone can search.">
                  <NumberInput
                    value={draft.maxRadiusKm}
                    min={1}
                    max={500}
                    suffix="km"
                    onChange={(event) => set('maxRadiusKm', event.target.value)}
                  />
                </Field>
              </div>

              <Toggle
                checked={draft.showDistance}
                onChange={(value) => set('showDistance', value)}
                label="Show distance on profiles"
                description="Turn off if you would rather not reveal how close people are."
              />
            </div>
          )}
        </SettingsSection>

        {/* Rooms Settings */}
        <SettingsSection
          icon={Radio}
          title="Rooms"
          description="Group chat with voice. Free to join by design."
          group="rooms"
          settings={settings}
          transform={(draft) => ({
            enabled: draft.enabled,
            maxParticipants: Number(draft.maxParticipants),
            voiceEnabled: draft.voiceEnabled,
            entryCoinCost: Number(draft.entryCoinCost),
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft.enabled}
                onChange={(value) => set('enabled', value)}
                label="Rooms available"
              />

              <Toggle
                checked={draft.voiceEnabled}
                onChange={(value) => set('voiceEnabled', value)}
                label="Voice in rooms"
                description="Audio is peer to peer, so the cap below is about connection quality, not server cost."
                disabled={!draft.enabled}
              />

              <Field label="People per room" hint="Voice quality drops well before 20 on a mesh.">
                <NumberInput
                  value={draft.maxParticipants}
                  min={2}
                  max={100}
                  suffix="people"
                  onChange={(event) => set('maxParticipants', event.target.value)}
                  disabled={!draft.enabled}
                />
              </Field>
            </div>
          )}
        </SettingsSection>

        {/* Mini Games Settings */}
        <SettingsSection
          icon={Gamepad2}
          title="Games"
          description="Mini games, points to coins exchange rate, and leaderboards."
          group="games"
          settings={settings}
          transform={(draft) => ({
            enabled: draft.enabled,
            leaderboardSize: Number(draft.leaderboardSize),
            maxSessionsPerDay: Number(draft.maxSessionsPerDay),
            coinsPerPointConversion: Number(draft.coinsPerPointConversion ?? 0),
            pointsPerCoin: Number(draft.pointsPerCoin ?? 100),
            minPointsToConvert: Number(draft.minPointsToConvert ?? 100),
            pointsConversionEnabled: draft.pointsConversionEnabled ?? true,
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft.enabled}
                onChange={(value) => set('enabled', value)}
                label="Games available"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Leaderboard size">
                  <NumberInput
                    value={draft.leaderboardSize}
                    min={3}
                    max={500}
                    suffix="players"
                    onChange={(event) => set('leaderboardSize', event.target.value)}
                    disabled={!draft.enabled}
                  />
                </Field>

                <Field label="Games per day" hint="Per player. Limits score farming.">
                  <NumberInput
                    value={draft.maxSessionsPerDay}
                    min={1}
                    max={1000}
                    suffix="games"
                    onChange={(event) => set('maxSessionsPerDay', event.target.value)}
                    disabled={!draft.enabled}
                  />
                </Field>
              </div>

              <div className="pt-2 border-t border-ink-100 dark:border-ink-800 space-y-4">
                <Toggle
                  checked={draft.pointsConversionEnabled ?? true}
                  onChange={(value) => set('pointsConversionEnabled', value)}
                  label="Allow Points to Coins Conversion"
                  description="When enabled, users can convert their game points into spendable coins in the app."
                  disabled={!draft.enabled}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Points per 1 Coin (Exchange Rate)"
                    hint={`e.g. 2,000 points = ${Math.floor(2000 / (Number(draft.pointsPerCoin) || 100))} coins`}
                  >
                    <NumberInput
                      value={draft.pointsPerCoin ?? 100}
                      min={1}
                      max={100000}
                      suffix="points = 1 coin"
                      onChange={(event) => set('pointsPerCoin', event.target.value)}
                      disabled={!draft.enabled || !(draft.pointsConversionEnabled ?? true)}
                    />
                  </Field>

                  <Field
                    label="Minimum Points to Convert"
                    hint="Minimum points a user must hold before converting."
                  >
                    <NumberInput
                      value={draft.minPointsToConvert ?? 100}
                      min={1}
                      max={100000}
                      suffix="pts minimum"
                      onChange={(event) => set('minPointsToConvert', event.target.value)}
                      disabled={!draft.enabled || !(draft.pointsConversionEnabled ?? true)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Moderation Settings */}
        <SettingsSection
          icon={ShieldAlert}
          title="Moderation"
          description="Automatic filtering. The report and block flow does the heavy lifting."
          group="moderation"
          settings={settings}
          transform={(draft) => ({
            profanityFilterEnabled: draft.profanityFilterEnabled,
            blockedWords: Array.isArray(draft.blockedWords)
              ? draft.blockedWords
              : String(draft.blockedWords ?? '')
                  .split(/[\n,]/)
                  .map((word) => word.trim())
                  .filter(Boolean),
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft.profanityFilterEnabled}
                onChange={(value) => set('profanityFilterEnabled', value)}
                label="Mask blocked words"
                description="Matched words are replaced with asterisks. The message still sends."
              />

              <Field
                label="Blocked words"
                hint="One per line or comma separated. Whole words only — an aggressive list mangles ordinary conversation."
              >
                <Textarea
                  rows={5}
                  value={
                    Array.isArray(draft.blockedWords)
                      ? draft.blockedWords.join('\n')
                      : (draft.blockedWords ?? '')
                  }
                  onChange={(event) => set('blockedWords', event.target.value.split('\n'))}
                  placeholder={'word one\nword two'}
                  disabled={!draft.profanityFilterEnabled}
                  className="font-mono text-xs"
                />
              </Field>
            </div>
          )}
        </SettingsSection>

        {/* App Version & Google Play */}
        <SettingsSection
          icon={Smartphone}
          title="App Version & Google Play"
          description="Manage Google Play release versions, minimum supported version, and force update requirements."
          group="appVersion"
          settings={settings}
          transform={(draft) => ({
            latestVersion: draft?.latestVersion,
            minimumVersion: draft?.minimumVersion,
            latestVersionCode: Number(draft?.latestVersionCode || 1),
            forceUpdate: Boolean(draft?.forceUpdate),
            playStoreUrl: draft?.playStoreUrl,
            appStoreUrl: draft?.appStoreUrl,
            updateMessage: draft?.updateMessage,
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Latest App Version" hint="e.g. 1.0.0 (Shown in Play Store)">
                  <Input
                    value={draft?.latestVersion ?? '1.0.0'}
                    onChange={(event) => set('latestVersion', event.target.value)}
                    placeholder="1.0.0"
                  />
                </Field>

                <Field label="Version Code (Android)" hint="Integer build number (e.g. 1, 2)">
                  <NumberInput
                    value={draft?.latestVersionCode ?? 1}
                    min={1}
                    max={100000}
                    onChange={(event) => set('latestVersionCode', event.target.value)}
                  />
                </Field>

                <Field label="Minimum Required Version" hint="Users below this MUST update">
                  <Input
                    value={draft?.minimumVersion ?? '1.0.0'}
                    onChange={(event) => set('minimumVersion', event.target.value)}
                    placeholder="1.0.0"
                  />
                </Field>
              </div>

              <Toggle
                checked={draft?.forceUpdate ?? false}
                onChange={(value) => set('forceUpdate', value)}
                label="Enforce Mandatory Update (Force Update)"
                description="When enabled, users on versions below 'Minimum Required Version' are prompted to update before continuing."
              />

              <Field label="Google Play Store URL" hint="Direct link to your app on Google Play Store.">
                <Input
                  value={draft?.playStoreUrl ?? ''}
                  onChange={(event) => set('playStoreUrl', event.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=app.vibechat.mobile"
                />
              </Field>

              <Field label="Update Announcement / Notes" hint="Shown to mobile users when an update is available.">
                <Input
                  value={draft?.updateMessage ?? ''}
                  onChange={(event) => set('updateMessage', event.target.value)}
                  placeholder="A new version of Vibe is available with new features and performance improvements!"
                />
              </Field>
            </div>
          )}
        </SettingsSection>

        {/* Girls Chat Earnings & Payouts (Dynamic Admin Settings) */}
        <SettingsSection
          icon={Coins}
          title="Girls Chat Earnings & Payouts"
          description="Configure message rewards for girls chatting with boys, 1 coin = ₹1 INR conversion rate, and payout rules."
          group="earnings"
          settings={settings}
          transform={(draft) => ({
            enabled: Boolean(draft?.enabled),
            messagesPerReward: Number(draft?.messagesPerReward || 25),
            rewardCoins: Number(draft?.rewardCoins || 1),
            coinsPerRupee: Number(draft?.coinsPerRupee || 1),
            minWithdrawalCoins: Number(draft?.minWithdrawalCoins || 5),
            maxWithdrawalCoinsPerDay: Number(draft?.maxWithdrawalCoinsPerDay || 5000),
            payoutProvider: draft?.payoutProvider || 'cashfree',
          })}
        >
          {({ draft, set }) => (
            <div className="space-y-4">
              <Toggle
                checked={draft?.enabled ?? true}
                onChange={(value) => set('enabled', value)}
                label="Enable Girls Chat-to-Earn System"
                description="When enabled, female users earn coins by chatting with male users and can convert coins to real rupees."
              />

              <div className="rounded-xl border border-pink-200 bg-pink-50/60 p-3 text-xs text-pink-900">
                💖 <strong>Current Dynamic Rule:</strong> Girls chatting with boys get{' '}
                <strong>{draft?.rewardCoins ?? 1} coin</strong> for every{' '}
                <strong>{draft?.messagesPerReward ?? 25} messages</strong>. Girls can convert{' '}
                <strong>{draft?.coinsPerRupee ?? 1} coin into ₹1.00 Rupee (1:1 INR Cash)</strong> anytime!
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Messages with Boys per Coin Reward"
                  hint="e.g. 25 messages (or 23, 20, 15) sent by girl to boys = 1 coin earned"
                >
                  <NumberInput
                    value={draft?.messagesPerReward ?? 25}
                    min={1}
                    max={1000}
                    onChange={(event) => set('messagesPerReward', event.target.value)}
                  />
                </Field>

                <Field
                  label="Coins Rewarded per Cycle"
                  hint="Coins credited when message target is reached (default: 1 coin)"
                >
                  <NumberInput
                    value={draft?.rewardCoins ?? 1}
                    min={1}
                    max={100}
                    onChange={(event) => set('rewardCoins', event.target.value)}
                  />
                </Field>

                <Field
                  label="Coins Required for ₹1 Rupee (Conversion Rate)"
                  hint="e.g. 1 coin = ₹1 INR (so 10 coins = ₹10.00, 50 coins = ₹50.00)"
                >
                  <NumberInput
                    value={draft?.coinsPerRupee ?? 1}
                    min={1}
                    max={10000}
                    onChange={(event) => set('coinsPerRupee', event.target.value)}
                  />
                </Field>

                <Field
                  label="Minimum Withdrawal Limit (Coins)"
                  hint="e.g. 5 coins (₹5.00) minimum required to request payout"
                >
                  <NumberInput
                    value={draft?.minWithdrawalCoins ?? 5}
                    min={1}
                    max={10000}
                    onChange={(event) => set('minWithdrawalCoins', event.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Refer & Earn */}
        <SettingsSection
          icon={Gift}
          title="Refer &amp; Earn"
          description="Coins credited to user A when they refer user B who successfully registers. Fully editable at runtime."
          group="referral"
          settings={settings}
          transform={(draft) => ({
            enabled: draft?.enabled ?? true,
            boyToBoy: Number(draft?.boyToBoy ?? 10),
            boyToGirl: Number(draft?.boyToGirl ?? 10),
            girlToBoy: Number(draft?.girlToBoy ?? 10),
            girlToGirl: Number(draft?.girlToGirl ?? 10),
          })}
        >
          {({ draft, set }) => {
            const isEnabled = draft?.enabled ?? true;
            return (
              <div className="space-y-5">
                <Toggle
                  checked={isEnabled}
                  onChange={(value) => set('enabled', value)}
                  label="Enable referral rewards"
                  description="When off, no coins are awarded for any referral."
                />

                <p className="text-sm text-ink-500 font-medium">Coins awarded to referrer (A) per gender combination</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="👦 Boy refers 👦 Boy">
                    <NumberInput
                      value={draft?.boyToBoy ?? 10}
                      min={0}
                      max={10000}
                      suffix="coins"
                      disabled={!isEnabled}
                      onChange={(event) => set('boyToBoy', event.target.value)}
                    />
                  </Field>

                  <Field label="👦 Boy refers 👧 Girl">
                    <NumberInput
                      value={draft?.boyToGirl ?? 10}
                      min={0}
                      max={10000}
                      suffix="coins"
                      disabled={!isEnabled}
                      onChange={(event) => set('boyToGirl', event.target.value)}
                    />
                  </Field>

                  <Field label="👧 Girl refers 👦 Boy">
                    <NumberInput
                      value={draft?.girlToBoy ?? 10}
                      min={0}
                      max={10000}
                      suffix="coins"
                      disabled={!isEnabled}
                      onChange={(event) => set('girlToBoy', event.target.value)}
                    />
                  </Field>

                  <Field label="👧 Girl refers 👧 Girl">
                    <NumberInput
                      value={draft?.girlToGirl ?? 10}
                      min={0}
                      max={10000}
                      suffix="coins"
                      disabled={!isEnabled}
                      onChange={(event) => set('girlToGirl', event.target.value)}
                    />
                  </Field>
                </div>

                <p className="text-xs text-ink-400">
                  Set any value to <strong>0</strong> to disable rewards for that gender combination without turning off the entire feature.
                </p>
              </div>
            );
          }}
        </SettingsSection>
      </div>
    </>
  );
}
