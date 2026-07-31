import type { BadgeVariantPerson, RecommendProject, RecommendRow } from "./types";
import styles from "./AiRecommendResultSection.module.css";

interface AiRecommendResultSectionProps {
  /** true 이면 테이블 골격·스켈레톤만 표시 (레이아웃 점프 방지) */
  loading?: boolean;
  totalShown: number;
  rows: RecommendRow[];
  selectedId: string | null;
  onSelectRow: (id: string) => void;
}

const SKELETON_ROW_COUNT = 10;

function SkeletonBlock({ widthPct = 100 }: { widthPct?: number }) {
  return (
    <div
      className={styles.skeletonBar}
      style={{ width: `${widthPct}%` }}
      aria-hidden
    />
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <tr key={`ai-rec-sk-${i}`} className={styles.skeletonRow}>
          <td className={styles.colRadio}>
            <div className={styles.skeletonRadio} aria-hidden />
          </td>
          <td className={styles.colState}>
            <SkeletonBlock widthPct={70} />
          </td>
          <td className={styles.colProfile}>
            <div className={styles.skeletonProfile}>
              <div className={styles.skeletonAvatar} aria-hidden />
              <div className={styles.skeletonProfileText}>
                <SkeletonBlock widthPct={85} />
                <SkeletonBlock widthPct={55} />
              </div>
            </div>
          </td>
          <td className={styles.colJob}>
            <div className={styles.skeletonJobCol}>
              <SkeletonBlock widthPct={90} />
              <SkeletonBlock widthPct={50} />
            </div>
          </td>
          <td className={styles.colProject}>
            <div className={styles.skeletonProjectCol}>
              <SkeletonBlock widthPct={95} />
              <SkeletonBlock widthPct={80} />
            </div>
          </td>
          <td className={styles.colScore}>
            <div className={styles.skeletonScoreCol}>
              <SkeletonBlock widthPct={40} />
              <SkeletonBlock widthPct={55} />
            </div>
          </td>
          <td className={styles.colReason}>
            <SkeletonBlock widthPct={100} />
          </td>
        </tr>
      ))}
    </>
  );
}

function badgeClass(variant: BadgeVariantPerson): string {
  switch (variant) {
    case "blue":
      return `${styles.badge} ${styles.badgeBlue}`;
    case "blue2":
      return `${styles.badge} ${styles.badgeBlue2}`;
    case "violet":
      return `${styles.badge} ${styles.badgeViolet}`;
    case "green":
      return `${styles.badge} ${styles.badgeGreen}`;
    default:
      return styles.badge;
  }
}

function IconChevronRightLink() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M3.5 2L6.5 5l-3 3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTriangle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path
        d="M4.37572 2.29957L6.77498 5.04027C7.05797 5.36354 6.8284 5.86961 6.39877 5.86961H1.60254C1.17301 5.86961 0.943402 5.36376 1.22617 5.04045L3.62315 2.29974C3.8223 2.07203 4.17647 2.07195 4.37572 2.29957Z"
        fill="#5F6675"
      />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg className={styles.alertIcon} width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M5.5 3.2V6M5.5 7.2v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 직무는 한 줄(`, ` 구분), 스킬셋은 칩으로 전부 표시 */
function JobSkillChips({ row }: { row: RecommendRow }) {
  let jobLine: string;
  let uniqueSkills: string[];

  if (row.jobSkillItems != null && row.jobSkillItems.length > 0) {
    const items = row.jobSkillItems;
    const jobLabels = items.map((it) => (it.jobLabel ?? "").trim()).filter(Boolean);
    jobLine = [...new Set(jobLabels)].join(", ") || row.jobLine?.trim() || "—";
    const skillLabels = items.map((it) => (it.skillLabel ?? "").trim()).filter(Boolean);
    const seen = new Set<string>();
    uniqueSkills = skillLabels.filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  } else {
    jobLine = row.jobLine?.trim() || "—";
    uniqueSkills =
      row.skillLine
        ?.split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
  }

  return (
    <div className={styles.jobSkillChips}>
      <div className={styles.jobLineRow}>{jobLine}</div>
      <div className={styles.jobSkillChipRow}>
        {uniqueSkills.length > 0 ? (
          uniqueSkills.map((label, idx) => (
            <div key={`${label}-${idx}`} className={styles.jobSkillCard}>
              <span className={styles.jobSkillCardSkill}>{label}</span>
            </div>
          ))
        ) : (
          <span className={styles.jobSkillEmpty}>—</span>
        )}
      </div>
    </div>
  );
}

function ProjectList({ projects }: { projects: RecommendProject[] }) {
  const visibleProjects = projects.slice(0, 2);
  const remainCount = projects.length - visibleProjects.length;

  return (
    <div className={styles.projectWrap}>
      <div className={styles.projectList}>
        {visibleProjects.map((project, index) => (
          <div className={styles.projectBox} key={`${project.title}-${project.period.main}-${index}`}>
            <div className={styles.projectRow}>
              <span className={styles.projectTitle}>{project.title}</span>
              <span className={badgeClass(project.status.variant)}>
                {project.status.label}
                {project.status.alert ? <IconAlertCircle /> : null}
              </span>
            </div>
            <div className={styles.projectRow}>
              <span className={styles.personRole}>{project.role}</span>
              <span className={styles.personNameSub}>{project.personName}</span>
            </div>
            <div className={styles.projectRow}>
              <span className={styles.projectPeriodMain}>{project.period.main}</span>
              <span className={styles.projectPeriodSub}>{project.period.sub}</span>
            </div>
          </div>
        ))}
      </div>
      {remainCount > 0 ? (
        <button type="button" className={styles.buttonMore}>
          <span>+{remainCount}</span>
          <IconTriangle />
        </button>
      ) : null}
    </div>
  );
}

export function AiRecommendResultSection({
  loading = false,
  totalShown,
  rows,
  selectedId,
  onSelectRow,
}: AiRecommendResultSectionProps) {
  return (
    <div
      className={styles.tableScroll}
      aria-busy={loading}
      data-loading={loading ? "true" : undefined}
    >
      <p className={`${styles.listHead} ${loading ? styles.listHeadLoading : ""}`}>
        {loading ? (
          "AI 추천 결과를 불러오는 중…"
        ) : (
          <>
            총 <span className={styles.listHeadNum}>{totalShown}</span> 건
          </>
        )}
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.colRadio} scope="col">
                <span className={styles.visuallyHidden}>선택</span>
              </th>
              <th className={styles.colState} scope="col">
                상태
              </th>
              <th className={styles.colProfile} scope="col">
                프로필
              </th>
              <th className={styles.colJob} scope="col">
                직무/스킬셋
              </th>
              <th className={styles.colProject} scope="col">
                투입 프로젝트
              </th>
              <th className={styles.colScore} scope="col">
                AI 추천 점수
              </th>
              <th className={styles.colReason} scope="col">
                AI 추천 사유
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.colRadio}>
                    <input
                      className={styles.radio}
                      type="radio"
                      name="ai-recommend"
                      checked={selectedId === row.id}
                      onChange={() => onSelectRow(row.id)}
                      aria-label={`${row.person.name} 선택`}
                    />
                  </td>
                  <td className={styles.colState}>
                    <span className={badgeClass(row.personStatus.variant)}>
                      {row.personStatus.label}
                      {row.personStatus.alert ? <IconAlertCircle /> : null}
                    </span>
                  </td>
                  <td className={styles.colProfile}>
                    <div className={styles.personRow}>
                      <div className={styles.avatar} aria-hidden />
                      <div className={styles.personMeta}>
                        <div className={styles.nameLine}>
                          <span className={styles.personName}>{row.person.name}</span>
                          <span className={styles.rankBadge}>{row.person.rank}</span>
                        </div>
                        {row.person.empId ? (
                          <a href="#" className={styles.empIdLink} onClick={(event) => event.preventDefault()}>
                            {row.person.empId}
                            <IconChevronRightLink />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.colJob} ${styles.tdJobSkill}`}>
                    <JobSkillChips row={row} />
                  </td>
                  <td className={styles.colProject}>
                    <ProjectList projects={row.projects} />
                  </td>
                  <td className={styles.colScore}>
                    <div className={styles.scoreBlock}>
                      <span className={styles.scoreLabel}>적합도</span>
                      <span className={styles.scoreValue}>{row.score}</span>
                    </div>
                  </td>
                  <td className={styles.colReason}>
                    <span className={styles.reason}>{row.reason}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading ? (
          <div className={styles.loadingVeil} aria-hidden>
            <span className={styles.loadingVeilSpinner} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
