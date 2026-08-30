import { useState } from 'react';
import { CalendarClock } from 'lucide-react';

import { Button } from './ui/Button.jsx';
import { Field, Input, Select } from './ui/Field.jsx';
import { Modal } from './ui/Modal.jsx';
import { formatDateTime } from '../lib/format.js';
import { useScheduleTheme } from '../hooks/queries.js';

/** `datetime-local` expects local wall-clock time, not an ISO string. */
function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ScheduleThemeDialog({ theme, themes, onClose }) {
  const [from, setFrom] = useState(toLocalInput(theme.scheduledFrom));
  const [until, setUntil] = useState(toLocalInput(theme.scheduledUntil));
  const [revertTo, setRevertTo] = useState(theme.revertToSlug ?? 'blush');

  const schedule = useScheduleTheme();

  const hasWindow = Boolean(from);
  const endsBeforeStart = from && until && new Date(until) <= new Date(from);
  const startsInPast = from && new Date(from) < new Date();

  async function save({ clear = false } = {}) {
    await schedule.mutateAsync({
      themeId: theme._id,
      scheduledFrom: clear || !from ? null : new Date(from).toISOString(),
      scheduledUntil: clear || !until ? null : new Date(until).toISOString(),
      revertToSlug: revertTo,
    });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Schedule “${theme.name}”`}
      description="The theme swaps itself in and out — nobody needs to be awake at midnight."
      size="md"
      footer={
        <>
          {(theme.scheduledFrom || theme.scheduledUntil) && (
            <Button
              variant="ghost"
              className="mr-auto text-red-600 hover:bg-red-50"
              onClick={() => save({ clear: true })}
              disabled={schedule.isPending}
            >
              Clear schedule
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={schedule.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => save()}
            isLoading={schedule.isPending}
            disabled={!hasWindow || endsBeforeStart}
          >
            Save schedule
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Goes live" hint="When the app switches to this theme.">
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>

        <Field
          label="Ends"
          hint="Leave empty to keep it until you change it by hand."
          error={endsBeforeStart ? 'The end must come after the start.' : null}
        >
          <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>

        <Field label="Then go back to" hint="Which theme takes over when the run ends.">
          <Select value={revertTo} onChange={(e) => setRevertTo(e.target.value)}>
            {themes
              .filter((option) => option.slug !== theme.slug)
              .map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
          </Select>
        </Field>

        {hasWindow && !endsBeforeStart && (
          <div className="rounded-xl bg-ink-50 px-3.5 py-3 text-sm text-ink-600">
            <p className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <span>
                <strong className="text-ink-900">{theme.name}</strong> runs from{' '}
                <strong className="text-ink-900">{formatDateTime(from)}</strong>
                {until ? (
                  <>
                    {' '}
                    to <strong className="text-ink-900">{formatDateTime(until)}</strong>, then{' '}
                    {themes.find((t) => t.slug === revertTo)?.name ?? revertTo} takes over.
                  </>
                ) : (
                  ', until you change it.'
                )}
              </span>
            </p>
          </div>
        )}

        {startsInPast && (
          // A window entirely in the past never fires, by design — worth
          // saying plainly rather than letting an admin wonder why nothing
          // happened.
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            That start time is in the past. It will go live at the next check, and if the end time
            has also passed it will not run at all.
          </p>
        )}
      </div>
    </Modal>
  );
}
