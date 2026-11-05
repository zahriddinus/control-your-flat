import "./settings.scss";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { ConfirmModal } from "../../components/ConfirmModal";
import { FlatForm } from "../../components/FlatForm";
import { Notice, useNotice } from "../../components/Notice";
import { TASKS } from "../../utils/schedule";

// Bazadagi uy -> forma qiymatlari
const toFormValues = (flat) => ({
  name: flat.name,
  startDate: flat.start_date,
  timezone: flat.timezone,
  address: flat.address ?? "",
  latitude: flat.latitude,
  longitude: flat.longitude,
});

// Bitta vazifa qoidasi: yoqilgan, necha kunda bir, bir navbatda necha kishi
const TaskRule = ({ taskKey, rule, onSave }) => {
  const { t } = useI18n();
  const [values, setValues] = useState(rule);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(rule), [rule]);

  const changed =
    values.enabled !== rule.enabled ||
    Number(values.every_days) !== rule.every_days ||
    Number(values.people) !== rule.people;

  async function handleSave() {
    setSaving(true);
    await onSave(taskKey, values);
    setSaving(false);
  }

  return (
    <div className={`settings__rule ${values.enabled ? "" : "settings__rule--off"}`}>
      <div className="d-flex align-items-center gap-3 flex-grow-1">
        <TaskIcon taskKey={taskKey} size="md" />

        <div className="text-start">
          <span className="fw-semibold d-block">{t(`tasks.${taskKey}.title`)}</span>

          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id={`rule-${taskKey}`}
              checked={values.enabled}
              onChange={(evt) => setValues({ ...values, enabled: evt.target.checked })}
              disabled={saving}
            />
            <label className="form-check-label small text-muted" htmlFor={`rule-${taskKey}`}>
              {values.enabled ? t("settings.enabled") : t("settings.disabled")}
            </label>
          </div>
        </div>
      </div>

      <div className="settings__rule-fields">
        <label className="small text-muted" htmlFor={`every-${taskKey}`}>
          {t("settings.everyDays")}
        </label>
        <input
          id={`every-${taskKey}`}
          type="number"
          className="form-control form-control-sm"
          min={1}
          max={31}
          value={values.every_days}
          onChange={(evt) => setValues({ ...values, every_days: evt.target.value })}
          disabled={saving || !values.enabled}
        />

        <label className="small text-muted" htmlFor={`people-${taskKey}`}>
          {t("settings.people")}
        </label>
        <input
          id={`people-${taskKey}`}
          type="number"
          className="form-control form-control-sm"
          min={1}
          max={4}
          value={values.people}
          onChange={(evt) => setValues({ ...values, people: evt.target.value })}
          disabled={saving || !values.enabled}
        />
      </div>

      <button
        type="button"
        className="btn btn-sm btn-primary settings__rule-save"
        onClick={handleSave}
        disabled={!changed || saving}
      >
        {saving ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
        ) : (
          t("settings.save")
        )}
      </button>
    </div>
  );
};

// Uy egasi uchun: uy ma'lumotlari, navbat qoidalari va uyni o'chirish
export const Settings = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { flat, flatId, flatTasks, reload, reloadTasks } = useFlat();
  const [notice, showNotice] = useNotice(3500);

  const [values, setValues] = useState(() => toFormValues(flat));
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setValues(toFormValues(flat)), [flat]);

  async function handleSaveFlat(evt) {
    evt.preventDefault();
    setSaving(true);

    const { error } = await supabase.rpc("update_flat", {
      p_flat: flatId,
      p_patch: {
        name: values.name.trim(),
        start_date: values.startDate,
        timezone: values.timezone,
        address: values.address.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
      },
    });

    setSaving(false);

    if (error) {
      console.error(error);
      showNotice(t("settings.saveError"), "danger");
      return;
    }

    await reload();
    showNotice(t("settings.saved"));
  }

  async function handleSaveRule(taskKey, rule) {
    const everyDays = Math.min(31, Math.max(1, Number(rule.every_days) || 1));
    const people = Math.min(4, Math.max(1, Number(rule.people) || 1));

    const { error } = await supabase.rpc("update_flat_task", {
      p_flat: flatId,
      p_task: taskKey,
      p_enabled: rule.enabled,
      p_every_days: everyDays,
      p_people: people,
    });

    if (error) {
      console.error(error);
      showNotice(t("settings.saveError"), "danger");
      return;
    }

    await reloadTasks();
    showNotice(t("settings.ruleSaved", { task: t(`tasks.${taskKey}.title`) }));
  }

  async function handleDelete() {
    setDeleting(true);

    const { error } = await supabase.from("flats").delete().eq("id", flatId);

    if (error) {
      console.error(error);
      showNotice(t("settings.deleteError"), "danger");
      setDeleting(false);
      return;
    }

    await reload();
    navigate("/", { replace: true });
  }

  return (
    <div className="settings container py-3 py-md-4">
      <h1 className="settings__title d-flex align-items-center gap-2 text-start">
        <span className="settings__title-icon" aria-hidden="true">
          <AppIcon name="sliders" />
        </span>
        {t("settings.title")}
      </h1>

      {/* UY MA'LUMOTLARI */}

      <form className="settings__section card border-0 shadow-sm" onSubmit={handleSaveFlat}>
        <div className="card-body p-3 p-md-4">
          <h2 className="settings__section-title">{t("settings.flatTitle")}</h2>

          <FlatForm values={values} onChange={setValues} disabled={saving} />

          <div className="text-end mt-3">
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              {t("settings.save")}
            </button>
          </div>
        </div>
      </form>

      {/* NAVBAT QOIDALARI */}

      <section className="settings__section card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4 text-start">
          <h2 className="settings__section-title">{t("settings.rulesTitle")}</h2>

          <p className="small text-muted d-flex gap-2">
            <AppIcon name="bulb" className="flex-shrink-0 mt-1" />
            {t("settings.rulesHint")}
          </p>

          <div className="d-flex flex-column gap-2">
            {TASKS.map((task) => {
              const rule = flatTasks.find((item) => item.task === task.key) ?? {
                enabled: false,
                every_days: 1,
                people: 1,
              };

              return (
                <TaskRule key={task.key} taskKey={task.key} rule={rule} onSave={handleSaveRule} />
              );
            })}
          </div>
        </div>
      </section>

      {/* XAVFLI ZONA */}

      <section className="settings__section settings__danger card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4 d-flex flex-column flex-sm-row align-items-sm-center gap-3 text-start">
          <div className="flex-grow-1">
            <h2 className="settings__section-title text-danger mb-1">
              {t("settings.dangerTitle")}
            </h2>
            <p className="small text-muted m-0">{t("settings.dangerText")}</p>
          </div>

          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <AppIcon name="trash" className="me-1" />
            {t("settings.deleteFlat")}
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={deleteOpen}
        title={t("settings.deleteTitle")}
        icon="trash"
        confirmLabel={t("settings.deleteFlat")}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      >
        <p className="m-0">{t("settings.deleteQuestion", { name: flat.name })}</p>
      </ConfirmModal>

      <Notice notice={notice} />
    </div>
  );
};
