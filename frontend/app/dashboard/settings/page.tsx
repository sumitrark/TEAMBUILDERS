"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Shield,
  UserRound,
  Save,
  Loader2,
} from "lucide-react";

import {
  getSettings,
  updateSettings,
  Settings,
} from "@/services/settings";

import PhoneVerification from "@/components/settings/PhoneVerification";

const defaultSettings: Settings = {
  team_invitations: true,
  hackathon_reminders: true,
  ai_recommendations: true,
  profile_visibility: "public",
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();

      setSettings({
        ...defaultSettings,
        ...data,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      setMessage("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await updateSettings(settings);

      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          className="animate-spin text-violet-600"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your account preferences and notifications.
        </p>
      </div>

      {/* Account */}
      <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3">
            <UserRound
              className="text-violet-600"
              size={22}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Account
            </h2>

            <p className="text-sm text-slate-500">
              Your account information
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div>
            <label className="text-sm font-medium text-slate-700">
              Account status
            </label>

            <div className="mt-2 rounded-xl border bg-slate-50 px-4 py-3 text-green-600">
              Active
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Account type
            </label>

            <div className="mt-2 rounded-xl border bg-slate-50 px-4 py-3">
              Student
            </div>
          </div>

        </div>
      </section>

      {/* Phone Verification */}
      <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3">
            <Shield
              className="text-violet-600"
              size={22}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Phone Verification
            </h2>

            <p className="text-sm text-slate-500">
              Verify your mobile number via OTP
            </p>
          </div>
        </div>

        <PhoneVerification />
      </section>

      {/* Notifications */}
      <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <Bell
              className="text-blue-600"
              size={22}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Notifications
            </h2>

            <p className="text-sm text-slate-500">
              Choose what you want to be notified about.
            </p>
          </div>
        </div>

        <SettingToggle
          title="Team Invitations"
          description="Receive notifications when someone invites you to a team."
          checked={settings.team_invitations}
          onChange={(value) =>
            updateField("team_invitations", value)
          }
        />

        <SettingToggle
          title="Hackathon Reminders"
          description="Get reminders about upcoming hackathons and deadlines."
          checked={settings.hackathon_reminders}
          onChange={(value) =>
            updateField("hackathon_reminders", value)
          }
        />

        <SettingToggle
          title="AI Match Recommendations"
          description="Receive recommendations for teammates and hackathons."
          checked={settings.ai_recommendations}
          onChange={(value) =>
            updateField("ai_recommendations", value)
          }
        />

      </section>

      {/* Privacy */}
      <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3">
            <Shield
              className="text-emerald-600"
              size={22}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Privacy
            </h2>

            <p className="text-sm text-slate-500">
              Control who can discover your profile.
            </p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Profile visibility
        </label>

        <select
          value={settings.profile_visibility}
          onChange={(event) =>
            updateField(
              "profile_visibility",
              event.target.value as Settings["profile_visibility"]
            )
          }
          className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="public">
            Public — visible to everyone
          </option>

          <option value="team_only">
            Team members only
          </option>

          <option value="private">
            Private — hidden from discovery
          </option>
        </select>

      </section>

      {/* Save */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">

        <div>
          {message && (
            <p
              className={
                message.includes("successfully")
                  ? "text-sm text-green-600"
                  : "text-sm text-red-600"
              }
            >
              {message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {saving ? "Saving..." : "Save Settings"}
        </button>

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
    <div className="flex items-center justify-between border-b py-5 last:border-b-0">

      <div className="pr-6">
        <h3 className="font-medium text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-violet-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}