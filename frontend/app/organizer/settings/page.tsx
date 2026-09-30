"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  Eye,
  Save,
  Users,
  Loader2,
  CheckCircle2,
  Settings as SettingsIcon,
} from "lucide-react";

import {
  getSettings,
  updateSettings,
  type Settings,
} from "@/services/settings";

const defaultSettings: Settings = {
  team_invitations: true,
  hackathon_reminders: true,
  ai_recommendations: true,
  profile_visibility: "public",
};

export default function OrganizerSettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);

        const data = await getSettings();

        setSettings({
          team_invitations:
            data.team_invitations ?? true,
          hackathon_reminders:
            data.hackathon_reminders ?? true,
          ai_recommendations:
            data.ai_recommendations ?? true,
          profile_visibility:
            data.profile_visibility ?? "public",
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Unable to load your settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSetting(
    key: keyof Settings,
    value: boolean | Settings["profile_visibility"]
  ) {
    setSaved(false);

    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const updated = await updateSettings(settings);

      setSettings({
        team_invitations:
          updated.team_invitations ?? settings.team_invitations,
        hackathon_reminders:
          updated.hackathon_reminders ??
          settings.hackathon_reminders,
        ai_recommendations:
          updated.ai_recommendations ??
          settings.ai_recommendations,
        profile_visibility:
          updated.profile_visibility ??
          settings.profile_visibility,
      });

      setSaved(true);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Unable to save your settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white px-8 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-violet-600" />

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your account preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-center rounded-2xl border bg-white p-12">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              Loading settings...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <SettingsIcon className="h-5 w-5 text-violet-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your account preferences and notifications.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Settings saved successfully.
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Notifications
                  </h2>

                  <p className="text-sm text-gray-500">
                    Choose which updates you want to receive.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              <SettingToggle
                title="Team invitations"
                description="Receive notifications about team invitations and team activity."
                checked={settings.team_invitations}
                onChange={(value) =>
                  updateSetting("team_invitations", value)
                }
              />

              <SettingToggle
                title="Hackathon reminders"
                description="Receive reminders about upcoming hackathon deadlines and events."
                checked={settings.hackathon_reminders}
                onChange={(value) =>
                  updateSetting("hackathon_reminders", value)
                }
              />
            </div>
          </section>

          {/* AI */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    AI Recommendations
                  </h2>

                  <p className="text-sm text-gray-500">
                    Control AI-powered recommendations for your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <SettingToggle
                title="Enable AI recommendations"
                description="Allow the platform to provide AI-powered recommendations and suggestions."
                checked={settings.ai_recommendations}
                onChange={(value) =>
                  updateSetting("ai_recommendations", value)
                }
              />
            </div>
          </section>

          {/* Privacy */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Eye className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Privacy
                  </h2>

                  <p className="text-sm text-gray-500">
                    Control how your profile is visible to other users.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block">
                <span className="text-sm font-semibold text-gray-900">
                  Profile visibility
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  Choose who can view your profile.
                </span>

                <select
                  value={settings.profile_visibility}
                  onChange={(event) =>
                    updateSetting(
                      "profile_visibility",
                      event.target.value as Settings["profile_visibility"]
                    )
                  }
                  className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="public">
                    Public — visible to everyone
                  </option>

                  <option value="team_only">
                    Team only — visible to your team
                  </option>

                  <option value="private">
                    Private — only visible to you
                  </option>
                </select>
              </label>
            </div>
          </section>

          {/* Organizer note */}
          <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

              <div>
                <h3 className="font-semibold text-violet-900">
                  Organizer account
                </h3>

                <p className="mt-1 text-sm leading-6 text-violet-800">
                  These preferences apply to your account across the
                  platform. Hackathon-specific configuration such as
                  evaluation criteria, judges, participants, and
                  proctoring is managed from each hackathon.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-violet-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}