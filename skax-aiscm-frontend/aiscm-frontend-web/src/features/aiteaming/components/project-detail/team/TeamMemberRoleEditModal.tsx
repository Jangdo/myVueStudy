"use client";

import { CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./TeamMemberRoleEditModal.module.css";
import { AppMessageDialog } from "@/shared/ui/AppDialog";
import Checkbox from "@/shared/ui/Checkbox/Checkbox";
import { aiteamingCommonService } from "@/features/aiteaming/services/aiteamingCommonService";
import { aiteamingProjectService } from "@/features/aiteaming/services/aiteamingProjectService";
import type { CommonJobSklstBundle, CommonRole } from "@/features/aiteaming/types/common";
import type { ProjectRoleSaveRequest } from "@/features/aiteaming/types/projectRole";
import { getJobTriState, toggleJobSkills, type JobTriState } from "./teamMemberRoleSelection";

export interface TeamMemberRoleEditModalProps {
  projectCode: string;
  pjtRoleDmndId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

interface SelectOption {
  id: string;
  label: string;
}

interface JobOption {
  id: string;
  label: string;
  skills: SelectOption[];
}

interface FormState {
  roleId: string;
  /** 저장·SSOT — 직무는 이 배열로 파생 표시만 */
  selectedSkillIds: string[];
  competencyText: string;
  startDate: string;
  endDate: string;
  /** 투입구분코드(rscr_tp_cd) — BC007 공통코드 cmm_cd_val */
  rscrTpCd: string;
  mh: string;
  mm: string;
}

type OverlayKey = "role" | "jobSkill" | "rscrTp" | "dateStart" | "dateEnd" | null;

const INITIAL_FORM: FormState = {
  roleId: "",
  selectedSkillIds: [],
  competencyText: "",
  startDate: "",
  endDate: "",
  rscrTpCd: "",
  mh: "",
  mm: "",
};

interface RoleSaveMeta {
  dmndTpCd: string;
  plvlTpCd: string;
  rscrHdcnt: number;
  mpAgsnStatTpCd: string | null;
}

function IconClose32() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown20() {
  return (
    <svg className={styles.iconChev} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronUp20() {
  return (
    <svg className={styles.iconChev} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 12.5l5-5 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendar16() {
  return (
    <svg className={styles.iconCal} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M2 6.5h12M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconAiSparkle8() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <path
        d="M4 0l.6 2.1L6.7 3 4.6 3.6 4 5.6 3.3 3.6 1.1 3l2.2-.6L4 0ZM2.3 5.3l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconChevronLeft16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronRight16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 직무 행: none / partial(indeterminate) / all */
function JobTriCheckbox({
  tri,
  onChange,
  className,
}: {
  tri: JobTriState;
  onChange: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.indeterminate = tri === "partial";
    }
  }, [tri]);
  return (
    <Checkbox
      ref={ref}
      className={className}
      checked={tri === "all"}
      onClick={(e) => e.stopPropagation()}
      onChange={onChange}
    />
  );
}

function getCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalCells = 42;

  const cells: { date: Date; inCurrentMonth: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inCurrentMonth: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inCurrentMonth: true,
    });
  }
  let nextDay = 1;
  while (cells.length < totalCells) {
    cells.push({
      date: new Date(year, month + 1, nextDay),
      inCurrentMonth: false,
    });
    nextDay += 1;
  }
  return cells;
}

function formatYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toNumberOrZero(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? Number(n) : 0;
}

/**
 * Figma 2484:20478 — 역할 수정하기 (SCM_역할 수정 팝업_De)
 * 안내 모달「정보 수정」확인 후 표시
 */
export function TeamMemberRoleEditModal({
  projectCode,
  pjtRoleDmndId,
  open,
  onClose,
  onSaved,
}: TeamMemberRoleEditModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [baselineForm, setBaselineForm] = useState<FormState>(INITIAL_FORM);
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  /** BC007 `rscr_tp_cd` 그룹 — 라벨 cmm_cd_nm, 값 cmm_cd_val */
  const [rscrTpOptions, setRscrTpOptions] = useState<SelectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [saveMeta, setSaveMeta] = useState<RoleSaveMeta | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<OverlayKey>(null);
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>({});
  const [activeJobId, setActiveJobId] = useState("");
  const [startViewDate, setStartViewDate] = useState(new Date());
  const [endViewDate, setEndViewDate] = useState(new Date());
  const roleTriggerRef = useRef<HTMLButtonElement>(null);
  const jobSkillTriggerRef = useRef<HTMLDivElement>(null);
  const rscrTpTriggerRef = useRef<HTMLButtonElement>(null);
  const startDateTriggerRef = useRef<HTMLButtonElement>(null);
  const endDateTriggerRef = useRef<HTMLButtonElement>(null);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "안내",
    message: "",
  });

  const showMessage = (message: string, title = "안내") => {
    setMessageDialog({ open: true, title, message });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeOverlay !== null) {
        setActiveOverlay(null);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, activeOverlay]);

  /** 역할·직무/스킬·투입구분 공통코드 + 역할 상세를 한 번에 로드(투입구분 정규화 순서 보장) */
  useEffect(() => {
    if (!open) return;
    let alive = true;
    /* 이전 행 데이터가 로딩 중에 보이지 않도록 즉시 초기화 */
    setForm(INITIAL_FORM);
    setBaselineForm(INITIAL_FORM);
    setSaveMeta(null);
    setRoleOptions([]);
    setJobOptions([]);
    setRscrTpOptions([]);
    setActiveJobId("");
    setActiveOverlay(null);
    setLoadingOptions(true);
    setLoadingDetail(true);
    setOptionsError("");
    setDetailError("");

    void (async () => {
      try {
        const [roles, bundles, grpCodes] = await Promise.all([
          aiteamingCommonService.getRoles(),
          aiteamingCommonService.getJobSklsts(),
          aiteamingCommonService.postGrpCodes(["rscr_tp_cd"]),
        ]);
        if (!alive) return;

        const mappedRoles: SelectOption[] = roles.map((role: CommonRole) => ({
          id: role.roleCd,
          label: role.roleNm,
        }));
        const mappedJobs: JobOption[] = bundles.map((bundle: CommonJobSklstBundle) => ({
          id: bundle.jobCd,
          label: bundle.jobNm,
          skills: (bundle.sklsts ?? []).map((sklst) => ({
            id: sklst.sklstCd,
            label: sklst.sklstNm,
          })),
        }));
        const mappedRscrTp: SelectOption[] = grpCodes
          .filter((row) => row.cmmGrpCd === "rscr_tp_cd")
          .map((row) => ({
            id: row.cmmCdVal,
            label: row.cmmCdNm,
          }));

        setRoleOptions(mappedRoles);
        setJobOptions(mappedJobs);
        setRscrTpOptions(mappedRscrTp);
        setActiveJobId((prev) => (prev && mappedJobs.some((job) => job.id === prev) ? prev : mappedJobs[0]?.id ?? ""));

        const allowedRscr = new Set(mappedRscrTp.map((o) => o.id));
        if (!pjtRoleDmndId) {
          setForm(INITIAL_FORM);
          setBaselineForm(INITIAL_FORM);
          setSaveMeta(null);
          return;
        }

        const detail = await aiteamingProjectService.getProjectRoleDetail(pjtRoleDmndId);
        if (!alive) return;

        const skillList = detail.sklst ?? [];
        const selectedSkillIds = Array.from(
          new Set(skillList.map((skill) => skill.sklstCd).filter((code): code is string => Boolean(code))),
        );
        const rawTp = (detail.rscrTpCd ?? "").trim();
        const rscrTpCdNorm = allowedRscr.has(rawTp) ? rawTp : "";

        const nextForm: FormState = {
          roleId: detail.roleCd ?? "",
          selectedSkillIds,
          competencyText: detail.jobCmptCntn ?? "",
          startDate: detail.rscrStrtDt ?? "",
          endDate: detail.rscrEndDt ?? "",
          rscrTpCd: rscrTpCdNorm,
          mh: String(detail.rscrMnh ?? ""),
          mm: String(detail.rscrMmth ?? ""),
        };
        setForm(nextForm);
        setBaselineForm(nextForm);
        setSaveMeta({
          dmndTpCd: detail.dmndTpCd,
          plvlTpCd: detail.plvlTpCd,
          rscrHdcnt: toNumberOrZero(detail.rscrHdcnt),
          mpAgsnStatTpCd: detail.mpAgsnStatTpCd ?? null,
        });
        const firstJobWithSkill =
          mappedJobs.find((j) => getJobTriState(j, selectedSkillIds) !== "none")?.id ?? mappedJobs[0]?.id ?? "";
        setActiveJobId(firstJobWithSkill);
      } catch (error: unknown) {
        if (!alive) return;
        const msg = error instanceof Error ? error.message : "데이터를 불러오는 중 오류가 발생했습니다.";
        setRoleOptions([]);
        setJobOptions([]);
        setRscrTpOptions([]);
        setActiveJobId("");
        setOptionsError(msg);
        setDetailError(msg);
      } finally {
        if (!alive) return;
        setLoadingOptions(false);
        setLoadingDetail(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, pjtRoleDmndId]);

  const startCalendarDays = useMemo(() => getCalendarDays(startViewDate), [startViewDate]);
  const endCalendarDays = useMemo(() => getCalendarDays(endViewDate), [endViewDate]);
  const isBootLoading = loadingOptions || loadingDetail;

  if (!mounted || !open) return null;

  const activeJob = jobOptions.find((job) => job.id === activeJobId) ?? jobOptions[0];
  const selectedRole = roleOptions.find((option) => option.id === form.roleId);
  const selectedRscrTp = rscrTpOptions.find((option) => option.id === form.rscrTpCd);
  /** 트리거 영역 태그 — 저장 대상인 스킬만 표시 */
  const selectedItems = jobOptions.flatMap((job) =>
    job.skills
      .filter((skill) => form.selectedSkillIds.includes(skill.id))
      .map((skill) => ({
        id: skill.id,
        label: skill.label,
      })),
  );
  const previewItems = selectedItems.slice(0, 3);
  const hiddenCount = Math.max(0, selectedItems.length - previewItems.length);
  const isDirty = JSON.stringify(form) !== JSON.stringify(baselineForm);
  const isRoleOpen = activeOverlay === "role";
  const isJobSkillOpen = activeOverlay === "jobSkill";
  const isRscrTpOpen = activeOverlay === "rscrTp";

  const toggleInArray = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  const openOverlay = (overlay: Exclude<OverlayKey, null>, anchor: HTMLElement | null) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const isDateOverlay = overlay === "dateStart" || overlay === "dateEnd";
    setOverlayStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: overlay === "dateEnd" ? Math.max(16, rect.right - 320) : rect.left,
      width: isDateOverlay ? 320 : rect.width,
      maxWidth: "calc(100vw - 32px)",
      zIndex: 2000,
    });
    setActiveOverlay(overlay);
  };
  const toggleOverlay = (overlay: Exclude<OverlayKey, null>, anchor: HTMLElement | null) => {
    setActiveOverlay((prev) => {
      if (prev === overlay) return null;
      if (anchor) {
        openOverlay(overlay, anchor);
      }
      return overlay;
    });
  };

  const handleToggleJob = (jobId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedSkillIds: toggleJobSkills(jobId, jobOptions, prev.selectedSkillIds),
    }));
  };

  const handleToggleSkill = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedSkillIds: toggleInArray(prev.selectedSkillIds, skillId),
    }));
  };

  const handleRemoveSkillTag = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedSkillIds: prev.selectedSkillIds.filter((item) => item !== skillId),
    }));
  };

  const handleReset = () => {
    setForm(baselineForm);
    setActiveOverlay(null);
    const first =
      jobOptions.find((j) => getJobTriState(j, baselineForm.selectedSkillIds) !== "none")?.id ??
      jobOptions[0]?.id ??
      "";
    setActiveJobId(first);
    setStartViewDate(new Date());
    setEndViewDate(new Date());
  };

  const handleSubmit = async () => {
    if (!pjtRoleDmndId) {
      showMessage("역할 수요 ID가 없어 수정할 수 없습니다.");
      return;
    }
    if (!saveMeta) {
      showMessage("역할 상세 정보가 아직 준비되지 않았습니다.");
      return;
    }
    if (form.selectedSkillIds.length === 0) {
      showMessage("스킬셋을 1개 이상 선택해 주세요.");
      return;
    }

    const skillJobMap = new Map<string, string>();
    for (const job of jobOptions) {
      for (const skill of job.skills) {
        if (!skillJobMap.has(skill.id)) {
          skillJobMap.set(skill.id, job.id);
        }
      }
    }

    const payload: ProjectRoleSaveRequest = {
      pjtRoleDmndId,
      pjtNo: projectCode,
      dmndTpCd: saveMeta.dmndTpCd,
      plvlTpCd: saveMeta.plvlTpCd,
      roleCd: form.roleId,
      rscrStrtDt: form.startDate,
      rscrEndDt: form.endDate,
      rscrTpCd: form.rscrTpCd,
      rscrMnh: toNumberOrZero(form.mh),
      rscrMmth: toNumberOrZero(form.mm),
      jobCmptCntn: form.competencyText,
      rscrHdcnt: saveMeta.rscrHdcnt,
      mpAgsnStatTpCd: saveMeta.mpAgsnStatTpCd,
      sklsts: form.selectedSkillIds.map((skillId) => ({
        sklstCd: skillId,
        jobCd: skillJobMap.get(skillId) ?? "",
        elmtSklNm: "",
      })),
    };

    const rscrAllowed = new Set(rscrTpOptions.map((o) => o.id));
    if (!form.rscrTpCd || !rscrAllowed.has(form.rscrTpCd)) {
      showMessage("투입형태를 목록에서 선택해 주세요.");
      return;
    }
    if (!payload.roleCd || !payload.rscrStrtDt || !payload.rscrEndDt || !payload.rscrTpCd) {
      showMessage("필수값(역할/투입기간/투입형태)을 확인해 주세요.");
      return;
    }
    if (payload.sklsts.some((skill) => !skill.jobCd)) {
      showMessage("스킬셋의 직무코드를 확인할 수 없습니다.");
      return;
    }

    setSaving(true);
    try {
      await aiteamingProjectService.saveProjectRoleCriteria(payload);
      await onSaved?.();
      onClose();
    } catch (error: unknown) {
      showMessage(error instanceof Error ? error.message : "역할 수정에 실패했습니다.", "오류");
    } finally {
      setSaving(false);
    }
  };
  const overlayNode =
    activeOverlay === null
      ? null
      : createPortal(
          <div
            className={styles.overlayBackdrop}
            role="presentation"
            onClick={(event) => {
              event.stopPropagation();
              setActiveOverlay(null);
            }}
          >
            <div style={overlayStyle} onClick={(event) => event.stopPropagation()}>
              {activeOverlay === "role" && (
                <div className={`${styles.fieldPanel} ${styles.popupPanel}`}>
                  <div className={`${styles.optionList} ${styles.optionListScrollable}`}>
                    {roleOptions.map((option) => (
                      <label key={option.id} className={styles.optionItem}>
                        <input
                          type="radio"
                          name="role"
                          checked={form.roleId === option.id}
                          onChange={() => {
                            setForm((prev) => ({ ...prev, roleId: option.id }));
                            setActiveOverlay(null);
                          }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {activeOverlay === "jobSkill" && (
                <div className={`${styles.fieldPanel} ${styles.popupPanel}`}>
                  <div className={styles.panelBody}>
                    <div className={styles.scrollArea}>
                      {jobOptions.map((job) => (
                        <div
                          key={job.id}
                          className={`${styles.optionItem} ${activeJobId === job.id ? styles.optionItemActive : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveJobId(job.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveJobId(job.id);
                            }
                          }}
                        >
                          <JobTriCheckbox
                            className={styles.listCheckbox}
                            tri={getJobTriState(job, form.selectedSkillIds)}
                            onChange={() => handleToggleJob(job.id)}
                          />
                          <button
                            type="button"
                            className={styles.jobNameBtn}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveJobId(job.id);
                            }}
                          >
                            {job.label}
                          </button>
                        </div>
                      ))}
                      {jobOptions.length === 0 && (
                        <div className={styles.optionEmptyText}>
                          {loadingOptions ? "목록을 불러오는 중입니다." : optionsError || "직무 목록이 없습니다."}
                        </div>
                      )}
                    </div>
                    <div className={styles.scrollArea}>
                      {activeJob?.skills.map((skill) => (
                        <div key={skill.id} className={styles.optionItem}>
                          <Checkbox
                            className={styles.listCheckbox}
                            checked={form.selectedSkillIds.includes(skill.id)}
                            onChange={() => handleToggleSkill(skill.id)}
                          >
                            {skill.label}
                          </Checkbox>
                        </div>
                      ))}
                      {!activeJob && (
                        <div className={styles.optionEmptyText}>
                          {loadingOptions ? "목록을 불러오는 중입니다." : optionsError || "스킬셋 목록이 없습니다."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeOverlay === "rscrTp" && (
                <div className={`${styles.fieldPanel} ${styles.popupPanel}`}>
                  <div className={styles.optionList}>
                    {rscrTpOptions.map((option) => (
                      <label key={option.id} className={styles.optionItem}>
                        <input
                          type="radio"
                          name="rscrTpCd"
                          checked={form.rscrTpCd === option.id}
                          onChange={() => {
                            setForm((prev) => ({ ...prev, rscrTpCd: option.id }));
                            setActiveOverlay(null);
                          }}
                        />
                        {option.label}
                      </label>
                    ))}
                    {rscrTpOptions.length === 0 && (
                      <div className={styles.optionEmptyText}>
                        {loadingOptions ? "목록을 불러오는 중입니다." : optionsError || "투입형태 코드가 없습니다."}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(activeOverlay === "dateStart" || activeOverlay === "dateEnd") && (
                <div className={styles.calendarPopup}>
                  <div className={styles.calendarHeader}>
                    <button
                      type="button"
                      className={styles.calendarNavBtn}
                      onClick={() =>
                        activeOverlay === "dateStart"
                          ? setStartViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                          : setEndViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                    >
                      <IconChevronLeft16 />
                    </button>
                    <strong className={styles.calendarTitle}>
                      {(activeOverlay === "dateStart" ? startViewDate : endViewDate).getFullYear()}년{" "}
                      {(activeOverlay === "dateStart" ? startViewDate : endViewDate).getMonth() + 1}월
                    </strong>
                    <button
                      type="button"
                      className={styles.calendarNavBtn}
                      onClick={() =>
                        activeOverlay === "dateStart"
                          ? setStartViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                          : setEndViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                    >
                      <IconChevronRight16 />
                    </button>
                  </div>
                  <div className={styles.calendarGridHead}>
                    {WEEKDAYS.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className={styles.calendarGridBody}>
                    {(activeOverlay === "dateStart" ? startCalendarDays : endCalendarDays).map(({ date, inCurrentMonth }) => {
                      const value = formatYmd(date);
                      const isSelected =
                        activeOverlay === "dateStart" ? form.startDate === value : form.endDate === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`${styles.calendarDateBtn} ${!inCurrentMonth ? styles.calendarDateMuted : ""} ${isSelected ? styles.calendarDateSelected : ""}`}
                          onClick={() => {
                            if (activeOverlay === "dateStart") {
                              setForm((prev) => ({ ...prev, startDate: value }));
                            } else {
                              setForm((prev) => ({ ...prev, endDate: value }));
                            }
                            setActiveOverlay(null);
                          }}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        );

  const node = (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            역할 수정하기
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <IconClose32 />
          </button>
        </div>
        <div
          className={styles.bodyScrollRegion}
          aria-busy={isBootLoading ? true : undefined}
          aria-live="polite"
        >
          <div className={styles.innerScroll}>
            <div className={styles.body}>
            {detailError ? <p className={styles.optionEmptyText}>{detailError}</p> : null}
            <div className={styles.selectField} aria-label="역할 선택">
              <div className={styles.labelRow}>
                <span className={styles.label}>역할</span>
              </div>
              <button
                ref={roleTriggerRef}
                type="button"
                className={styles.fieldTrigger}
                onClick={() => toggleOverlay("role", roleTriggerRef.current)}
              >
                <div className={`${styles.valueRow} ${styles.valueRowFixed}`}>
                  <span className={`${styles.valuePlaceholder} ${selectedRole ? styles.valueSelectedText : ""}`}>
                    {selectedRole?.label ?? "역할을 선택해주세요"}
                  </span>
                  <div className={styles.panelButtonArea}>
                    <span
                      className={styles.panelbutton}
                      aria-hidden="true"
                    >
                      {isRoleOpen ? <IconChevronUp20 /> : <IconChevronDown20 />}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className={styles.selectField} aria-label="직무 및 스킬셋 선택">
              <div className={styles.labelRow}>
                <span className={styles.label}>직무 &amp; Skill set</span>
              </div>
              <div
                className={styles.fieldTriggerDiv}
                ref={jobSkillTriggerRef}
                role="button"
                tabIndex={0}
                onClick={() => toggleOverlay("jobSkill", jobSkillTriggerRef.current)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleOverlay("jobSkill", jobSkillTriggerRef.current);
                  }
                }}
              >
                <div className={`${styles.valueRow} ${styles.valueRowFixed}`}>
                  <div className={styles.valueMain}>
                    {selectedItems.length === 0 ? (
                      <span className={styles.valuePlaceholder}>직무와 스킬셋을 선택해주세요</span>
                    ) : (
                      <div className={styles.valueSelected}>
                        <div className={styles.selectedArea}>
                          {previewItems.map((item) => (
                            <span key={`sk-${item.id}`} className={styles.seletedItem}>
                              <span className={styles.seletedItemTitle}>{item.label}</span>
                              <button
                                type="button"
                                className={styles.selectedButtonDel}
                                aria-label={`${item.label} 삭제`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleRemoveSkillTag(item.id);
                                }}
                              >
                                <IconClose32 />
                              </button>
                            </span>
                          ))}
                        </div>
                        {hiddenCount > 0 && (
                          <div className={styles.countArea}>
                            <span className={styles.seletedItem}>
                              <span className={styles.seletedItemTitle}>+{hiddenCount}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.panelButtonArea}>
                    <span
                      className={styles.panelbutton}
                      aria-hidden="true"
                    >
                      {isJobSkillOpen ? <IconChevronUp20 /> : <IconChevronDown20 />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.competencyBlock}>
              <div className={styles.labelRow}>
                <span className={styles.label}>직무역량 및 제약조건</span>
              </div>
              <div className={styles.competencyField}>
                <textarea
                  className={styles.competencyTextarea}
                  placeholder="직무역량 및 제약조건을 입력해주세요"
                  value={form.competencyText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      competencyText: event.target.value,
                    }))
                  }
                />
                <button type="button" className={styles.aiInputBtn} aria-label="AI로 입력">
                  <IconAiSparkle8 />
                  AI로 입력
                </button>
              </div>
            </div>

            <div className={styles.dateRow}>
              <div className={styles.dateCell} aria-label="투입일 선택">
                <div className={styles.labelRow}>
                  <span className={styles.label}>투입일</span>
                </div>
                <button
                  ref={startDateTriggerRef}
                  type="button"
                  className={styles.fieldTrigger}
                  onClick={() => {
                    toggleOverlay("dateStart", startDateTriggerRef.current);
                  }}
                >
                  <div className={styles.valueRow}>
                  <span className={`${styles.valuePlaceholder} ${form.startDate ? styles.valueSelectedText : ""}`}>
                    {form.startDate || "날짜를 선택해주세요"}
                  </span>
                    <IconCalendar16 />
                  </div>
                </button>
              </div>
              <div className={styles.dateCell} aria-label="종료일 선택">
                <div className={styles.labelRow}>
                  <span className={styles.label}>종료일</span>
                </div>
                <button
                  ref={endDateTriggerRef}
                  type="button"
                  className={styles.fieldTrigger}
                  onClick={() => {
                    toggleOverlay("dateEnd", endDateTriggerRef.current);
                  }}
                >
                  <div className={styles.valueRow}>
                    <span className={`${styles.valuePlaceholder} ${form.endDate ? styles.valueSelectedText : ""}`}>
                      {form.endDate || "날짜를 선택해주세요"}
                    </span>
                    <IconCalendar16 />
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.selectField} aria-label="투입형태 선택">
              <div className={styles.labelRow}>
                <span className={styles.label}>투입형태</span>
              </div>
              <button
                ref={rscrTpTriggerRef}
                type="button"
                className={styles.fieldTrigger}
                onClick={() => toggleOverlay("rscrTp", rscrTpTriggerRef.current)}
              >
                <div className={`${styles.valueRow} ${styles.valueRowFixed}`}>
                  <span className={`${styles.valuePlaceholder} ${selectedRscrTp ? styles.valueSelectedText : ""}`}>
                    {selectedRscrTp?.label ?? "투입형태를 선택해주세요"}
                  </span>
                  <div className={styles.panelButtonArea}>
                    <span
                      className={styles.panelbutton}
                      aria-hidden="true"
                    >
                      {isRscrTpOpen ? <IconChevronUp20 /> : <IconChevronDown20 />}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className={`${styles.selectField} ${styles.hoursField}`}>
              <div className={styles.labelRow}>
                <span className={styles.label}>투입시간</span>
              </div>
              <div className={styles.hoursValueRow}>
                <div className={styles.hoursCol}>
                  <input
                    className={styles.hoursInput}
                    type="number"
                    min="0"
                    value={form.mh}
                    onChange={(event) => setForm((prev) => ({ ...prev, mh: event.target.value }))}
                    placeholder="0"
                  />
                  <span className={styles.hoursUnit}>M/H</span>
                </div>
                <div className={styles.hoursCol}>
                  <input
                    className={styles.hoursInput}
                    type="number"
                    min="0"
                    value={form.mm}
                    onChange={(event) => setForm((prev) => ({ ...prev, mm: event.target.value }))}
                    placeholder="0"
                  />
                  <span className={styles.hoursUnit}>M/M</span>
                </div>
              </div>
            </div>
          </div>
          </div>
          {isBootLoading ? (
            <div className={styles.bootLoadingVeil} role="status">
              <span className={styles.bootLoadingSpinner} aria-hidden />
              <span className={styles.bootLoadingText}>역할 정보를 불러오는 중입니다.</span>
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btnReset} onClick={handleReset}>
            초기화
          </button>
          <button type="button" className={styles.btnSubmit} disabled={!isDirty || loadingDetail || saving} onClick={handleSubmit}>
            역할 수정
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {node}
      {overlayNode}
      <AppMessageDialog
        open={messageDialog.open}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={() => setMessageDialog((prev) => ({ ...prev, open: false }))}
      />
    </>,
    document.body,
  );
}
