"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  createEvaluationCriterion,
  deleteEvaluationCriterion,
  EvaluationCriterion,
  getEvaluationCriteria,
  updateEvaluationCriterion,
} from "@/services/organizerHackathon";

interface CriterionForm {
  key: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
  display_order: number;
}

const emptyForm: CriterionForm = {
  key: "",
  name: "",
  description: "",
  max_score: 10,
  weight: 0,
  display_order: 0,
};

export default function EvaluationCriteriaPage() {
  const params = useParams();
  const hackathonId = String(params.id);

  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CriterionForm>(emptyForm);

  const activeCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.is_active),
    [criteria]
  );

  const totalWeight = useMemo(
    () =>
      activeCriteria.reduce(
        (total, criterion) => total + criterion.weight,
        0
      ),
    [activeCriteria]
  );

  async function loadCriteria() {
    try {
      setLoading(true);
      setError("");

      const data = await getEvaluationCriteria(hackathonId);
      setCriteria(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load evaluation criteria."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hackathonId) {
      loadCriteria();
    }
  }, [hackathonId]);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      display_order: criteria.length,
    });
    setShowForm(true);
    setError("");
  }

  function startEdit(criterion: EvaluationCriterion) {
    setEditingId(criterion.id);
    setForm({
      key: criterion.key,
      name: criterion.name,
      description: criterion.description ?? "",
      max_score: criterion.max_score,
      weight: criterion.weight,
      display_order: criterion.display_order,
    });
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCriterion() {
    if (!form.key.trim() || !form.name.trim()) {
      setError("Criterion key and name are required.");
      return;
    }

    if (form.max_score <= 0) {
      setError("Maximum score must be greater than zero.");
      return;
    }

    if (form.weight < 0) {
      setError("Weight cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateEvaluationCriterion(editingId, {
          key: form.key.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          max_score: form.max_score,
          weight: form.weight,
          display_order: form.display_order,
        });
      } else {
        await createEvaluationCriterion(hackathonId, {
          key: form.key.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          max_score: form.max_score,
          weight: form.weight,
          display_order: form.display_order,
          is_active: true,
        });
      }

      cancelForm();
      await loadCriteria();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to save the evaluation criterion."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivateCriterion(criterion: EvaluationCriterion) {
    if (
      !window.confirm(
        `Deactivate "${criterion.name}"? It will no longer be used for active judging.`
      )
    ) {
      return;
    }

    try {
      setError("");
      await deleteEvaluationCriterion(criterion.id);
      await loadCriteria();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to deactivate the evaluation criterion."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/organizer/hackathons/${hackathonId}`}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to hackathon
            </Link>

            <h1 className="text-3xl font-bold text-slate-900">
              Evaluation Criteria
            </h1>
            <p className="mt-1 text-slate-600">
              Configure how judges score projects in this hackathon.
            </p>
          </div>

          <button
            type="button"
            onClick={startCreate}
            disabled={showForm}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add criterion
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active criteria
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {activeCriteria.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total weight
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalWeight}%
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Configuration
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                totalWeight === 100
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {totalWeight === 100
                ? "Ready for 100% weighting"
                : "Weights should total 100%"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {showForm && (
          <section className="mb-6 rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit criterion" : "Add criterion"}
                </h2>
                <p className="text-sm text-slate-500">
                  Define the scoring category and its contribution.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Key
                </span>
                <input
                  value={form.key}
                  onChange={(event) =>
                    setForm({ ...form, key: event.target.value })
                  }
                  placeholder="innovation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Innovation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="What should judges consider?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Maximum score
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.max_score}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      max_score: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Weight (%)
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.weight}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      weight: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Display order
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      display_order: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCriterion}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save criterion"}
              </button>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Scoring criteria
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading criteria...
            </div>
          ) : criteria.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-900">
                No criteria configured
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add the scoring categories judges should use.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className={`p-6 ${
                    !criterion.is_active ? "bg-slate-50 opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {criterion.name}
                        </h3>

                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {criterion.key}
                        </span>

                        {criterion.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </div>

                      {criterion.description && (
                        <p className="mt-2 text-sm text-slate-600">
                          {criterion.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>
                          Max score:{" "}
                          <strong className="text-slate-700">
                            {criterion.max_score}
                          </strong>
                        </span>
                        <span>
                          Weight:{" "}
                          <strong className="text-slate-700">
                            {criterion.weight}%
                          </strong>
                        </span>
                        <span>
                          Order:{" "}
                          <strong className="text-slate-700">
                            {criterion.display_order}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(criterion)}
                        disabled={showForm}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>

                      {criterion.is_active && (
                        <button
                          type="button"
                          onClick={() =>
                            deactivateCriterion(criterion)
                          }
                          disabled={showForm}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
