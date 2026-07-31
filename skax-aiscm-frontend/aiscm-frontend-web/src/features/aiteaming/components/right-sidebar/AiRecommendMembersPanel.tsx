import Link from "next/link";

import Button from "@/shared/ui/Button/Button";
import Badge from "@/shared/ui/Badge/Badge";

import styles from "./RightSidebarPanel.module.css";

const noImageProfileSrc = new URL(
  "../../../../shared/Images/common/noimage_profile.png",
  import.meta.url,
).href;

export function AiRecommendMembersPanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>{"'{역할}'에 대해 AI로 추천된 전체 인력입니다."}</p>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.contentBox}>
          <p className={styles.contentTitle}>AI 추천 인력</p>
          <table className={`table ${styles.tableMock}`} aria-label="AI 추천 인력 테이블">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "auto" }} />
            </colgroup>
            <thead>
              <tr>
                <th>선택</th>
                <th>상태</th>
                <th>프로필</th>
                <th>AI추천점수</th>
                <th>추천 사유</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="radio"
                    className={styles.tableCheckbox}
                  />
                </td>
                <td>
                  <Badge
                    type="type1"
                    color="blue"
                  >
                    가용
                  </Badge>
                </td>
                <td>
                  <div className="profileBox">
                    <div className="thumb">
                      <img src={noImageProfileSrc} alt="기본 프로필 이미지" />
                    </div>
                    <div className="info">
                      <span className="name">홍길동</span>
                      <span className="badge grade">P4</span>
                      <Link href={`#none`} className="grade">000000</Link>
                    </div>
                  </div>
                </td>
                <td><span className="score lg">95</span></td>
                <td className="tal">추천 사유가 들어가는 영역 추천 사유가 들어가는 영역 추천 사유가 들어가</td>
              </tr>
              <tr>
                <td>김영희</td>
                <td>P4</td>
                <td>88</td>
                <td>88</td>
                <td>추천 사유가 들어가는 영역 추천 사유가 들어가는 영역 추천 사유가 들어가</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.buttonsRow}>
          <Button variant="outlined" color="assistive" round>선택 적용</Button>
          <Button variant="outlined" color="assistive" round>AI 추천 조건 재설정</Button>
          <Button variant="outlined" color="assistive" round>단가 등급만 지정</Button>
        </div>
        <span className={styles.timeText}>오후 04:46</span>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.ButtonsRow}>
          <Button color="primary" size="lg">AI 추천 조건 재설정</Button>
        </div>
      </div>
    </section>
  );
}
