import { useMemo, useState } from 'react';
import { Check, Palette, Plus, Save, Sparkles, Trash2 } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { ColorInput, Field, Input, NumberInput } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { ThemePreview, ThemeSwatches } from '../components/ThemePreview.jsx';
import {
  useActivateTheme,
  useCreateTheme,
  useDeleteTheme,
  useThemes,
  useUpdateTheme,
} from '../hooks/queries.js';

/**
 * Colours are grouped by the job they do rather than listed alphabetically:
 * an operator changing "the pink" needs to find every token that carries the
 * brand, not hunt through 24 fields in dictionary order.
 */
const COLOR_GROUPS = [
  {
    label: 'Brand',
    hint: 'The main identity colours, used for buttons, sent messages and highlights.',
    keys: ['primary', 'primaryDark', 'primaryLight', 'onPrimary', 'secondary', 'accent'],
  },
  {
    label: 'Surfaces',
    hint: 'Page and card backgrounds, and the lines between them.',
    keys: ['background', 'surface', 'surfaceAlt', 'border'],
  },
  {
    label: 'Text',
    hint: 'Check these against your surfaces in the preview.',
    keys: ['textPrimary', 'textSecondary', 'textMuted'],
  },
  {
    label: 'Status',
    hint: 'Success, warning and error states.',
    keys: ['success', 'warning', 'danger', 'info'],
  },
  {
    label: 'Accents',
    hint: 'Header gradient, gender tints, presence dots and the coin colour.',
    keys: ['gradientStart', 'gradientEnd', 'maleAccent', 'femaleAccent', 'onlineDot', 'offlineDot', 'coinGold'],
  },
];

function humanise(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function CreateThemeDialog({ isOpen, onClose, baseTheme }) {
  const [name, setName] = useState('');
  const create = useCreateTheme();

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  async function handleSubmit() {
    await create.mutateAsync({
      name: name.trim(),
      slug,
      // Starting from the theme on screen beats starting from nothing: most
      // custom themes are a tweak of an existing one.
      colors: baseTheme?.colors,
      branding: baseTheme?.branding,
      isDark: baseTheme?.isDark ?? false,
    });
    setName('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New theme"
      description={baseTheme ? `Starts as a copy of ${baseTheme.name}.` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={create.isPending} disabled={slug.length < 2}>
            Create theme
          </Button>
        </>
      }
    >
      <Field label="Name" hint={slug ? `Identifier: ${slug}` : 'Letters and numbers.'}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Diwali Special"
          maxLength={60}
          autoFocus
        />
      </Field>
    </Modal>
  );
}

export function AppearancePage() {
  const { data: themes, isLoading, error, refetch } = useThemes();

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftThemeId, setDraftThemeId] = useState(null);
  const [dialog, setDialog] = useState(null);

  const activate = useActivateTheme();
  const update = useUpdateTheme();
  const remove = useDeleteTheme();

  const selected = useMemo(
    () => themes?.find((theme) => theme._id === selectedId) ?? themes?.find((theme) => theme.isActive) ?? themes?.[0],
    [themes, selectedId],
  );

  // Reset the working copy whenever a different theme is opened, so edits to one
  // theme never leak into another. Done during render rather than in an effect:
  // an effect would paint one frame of the previous theme's colours into the
  // editor and preview before correcting itself.
  if (selected && draftThemeId !== selected._id) {
    setDraftThemeId(selected._id);
    setDraft({ colors: { ...selected.colors }, branding: { ...selected.branding } });
  }

  if (isLoading) return <LoadingState label="Loading themes…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const hasUnsavedChanges =
    draft &&
    selected &&
    (JSON.stringify(draft.colors) !== JSON.stringify(selected.colors) ||
      JSON.stringify(draft.branding) !== JSON.stringify(selected.branding));

  function setColor(key, value) {
    setDraft((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));
  }

  function setBranding(key, value) {
    setDraft((current) => ({ ...current, branding: { ...current.branding, [key]: value } }));
  }

  async function handleSave() {
    await update.mutateAsync({
      themeId: selected._id,
      colors: draft.colors,
      branding: draft.branding,
    });
  }

  return (
    <>
      <PageHeader
        title="Appearance"
        description="Pick a look and make it live. Connected apps re-colour immediately — no update needed."
        action={
          <Button icon={Plus} onClick={() => setDialog('create')}>
            New theme
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {themes.map((theme) => {
          const isSelected = selected?._id === theme._id;

          return (
            <Card
              key={theme._id}
              className={`overflow-hidden transition ${
                isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:border-ink-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(theme._id)}
                className="w-full p-4 text-left"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                    {theme.name}
                  </span>
                  {theme.isActive && (
                    <Badge tone="success">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Live
                    </Badge>
                  )}
                  {theme.isPreset && !theme.isActive && <Badge tone="neutral">Built in</Badge>}
                </div>

                <ThemeSwatches colors={theme.colors} />

                <p className="mt-2.5 line-clamp-2 text-xs text-ink-500">
                  {theme.description || (theme.isDark ? 'Dark theme' : 'Light theme')}
                </p>
              </button>

              <div className="flex items-center gap-2 border-t border-ink-200/70 px-4 py-2.5">
                {theme.isActive ? (
                  <span className="text-xs font-medium text-emerald-600">Currently live</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Sparkles}
                    isLoading={activate.isPending && activate.variables === theme._id}
                    onClick={() => activate.mutate(theme._id)}
                  >
                    Make live
                  </Button>
                )}

                {!theme.isPreset && !theme.isActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${theme.name}`}
                    onClick={() => setDialog({ type: 'delete', theme })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selected && draft && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader
              title={`Editing “${selected.name}”`}
              description={
                selected.isPreset
                  ? 'Built-in themes can be edited. Duplicate one first if you want to keep the original.'
                  : 'Changes apply to the live app as soon as you save, if this theme is active.'
              }
              action={
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!hasUnsavedChanges}
                    onClick={() =>
                      setDraft({ colors: { ...selected.colors }, branding: { ...selected.branding } })
                    }
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    icon={Save}
                    disabled={!hasUnsavedChanges}
                    isLoading={update.isPending}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              }
            />

            <CardBody className="space-y-7">
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Branding</h3>
                <p className="mb-3 text-xs text-ink-500">Name and shape, shown throughout the app.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="App name">
                    <Input
                      value={draft.branding.appName ?? ''}
                      onChange={(event) => setBranding('appName', event.target.value)}
                      maxLength={40}
                    />
                  </Field>
                  <Field label="Tagline">
                    <Input
                      value={draft.branding.tagline ?? ''}
                      onChange={(event) => setBranding('tagline', event.target.value)}
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Corner radius" hint="How rounded cards and buttons look.">
                    <NumberInput
                      value={draft.branding.borderRadius ?? 18}
                      min={0}
                      max={40}
                      onChange={(event) => setBranding('borderRadius', Number(event.target.value))}
                      suffix="px"
                    />
                  </Field>
                  <Field label="Font family">
                    <Input
                      value={draft.branding.fontFamily ?? ''}
                      onChange={(event) => setBranding('fontFamily', event.target.value)}
                      maxLength={60}
                    />
                  </Field>
                </div>
              </section>

              {COLOR_GROUPS.map((group) => (
                <section key={group.label}>
                  <h3 className="text-sm font-semibold text-ink-900">{group.label}</h3>
                  <p className="mb-3 text-xs text-ink-500">{group.hint}</p>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                    {group.keys.map((key) => (
                      <div key={key}>
                        <label htmlFor={`color-${key}`} className="mb-1 block text-xs font-medium text-ink-600">
                          {humanise(key)}
                        </label>
                        <ColorInput
                          id={`color-${key}`}
                          label={humanise(key)}
                          value={draft.colors[key]}
                          onChange={(value) => setColor(key, value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </CardBody>
          </Card>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader
                title="Live preview"
                description="How the chat screen looks with these colours."
              />
              <CardBody className="bg-ink-100/60">
                <ThemePreview colors={draft.colors} branding={draft.branding} />
              </CardBody>
              {hasUnsavedChanges && (
                <div className="border-t border-ink-200/70 bg-amber-50 px-5 py-3">
                  <p className="text-xs text-amber-800">
                    Unsaved changes — the app is still showing the saved version.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <CreateThemeDialog
        isOpen={dialog === 'create'}
        onClose={() => setDialog(null)}
        baseTheme={selected}
      />

      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await remove.mutateAsync(dialog.theme._id);
          setDialog(null);
        }}
        title={`Delete “${dialog?.theme?.name}”?`}
        message="This cannot be undone. The theme will be removed permanently."
        confirmLabel="Delete theme"
        isLoading={remove.isPending}
      />

      {themes.length === 0 && (
        <Card className="p-12 text-center">
          <Palette className="mx-auto mb-3 h-6 w-6 text-ink-300" aria-hidden="true" />
          <p className="text-sm text-ink-500">No themes yet. Run the backend seeder to add the presets.</p>
        </Card>
      )}
    </>
  );
}
