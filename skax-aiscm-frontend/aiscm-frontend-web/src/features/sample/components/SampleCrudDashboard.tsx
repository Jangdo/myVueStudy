"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleApiPrefix } from "@/shared/config/apiSurfaces";
import { sampleService } from "@/features/sample/services/sampleService";
import type { CommonUserSummary, SampleItem } from "@/features/sample/types";
import styles from "./SampleCrudDashboard.module.css";

interface PanelState {
  items: SampleItem[];
  name: string;
  description: string;
  editId: number | null;
  loading: boolean;
  message: string;
  error: string;
}

const createInitialState = (): PanelState => ({
  items: [],
  name: "",
  description: "",
  editId: null,
  loading: false,
  message: "",
  error: "",
});

const toLocale = (value: string): string =>
  new Date(value).toLocaleString("ko-KR", {
    hour12: false,
  });

export default function SampleCrudDashboard() {
  const [state, setState] = useState<PanelState>(createInitialState);

  const [feignUserId, setFeignUserId] = useState("");
  const [feignResult, setFeignResult] = useState<CommonUserSummary | null>(null);
  const [feignLoading, setFeignLoading] = useState(false);
  const [feignMessage, setFeignMessage] = useState("");
  const [feignError, setFeignError] = useState("");

  const loadItems = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: "", message: "" }));
    try {
      const items = await sampleService.findAll();
      setState((prev) => ({ ...prev, items, loading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "조회에 실패했습니다.";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const resetForm = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      name: "",
      description: "",
      editId: null,
    }));
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const name = state.name.trim();
    const description = state.description.trim();

    if (!name) {
      setState((prev) => ({
        ...prev,
        error: "name은 필수입니다.",
        message: "",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: "", message: "" }));

      if (state.editId === null) {
        await sampleService.create({ name, description });
        setState((prev) => ({
          ...prev,
          loading: false,
          message: "등록이 완료되었습니다.",
        }));
      } else {
        await sampleService.update(state.editId, { name, description });
        setState((prev) => ({
          ...prev,
          loading: false,
          message: "수정이 완료되었습니다.",
        }));
      }

      resetForm();
      await loadItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [loadItems, resetForm, state.description, state.editId, state.name]);

  const handleEdit = useCallback((item: SampleItem): void => {
    setState((prev) => ({
      ...prev,
      name: item.name,
      description: item.description ?? "",
      editId: item.id,
      message: "",
      error: "",
    }));
  }, []);

  const handleFeignLookup = useCallback(async (): Promise<void> => {
    const userIdRaw = feignUserId.trim();
    const userIdPattern = /^[0-9]{5}$/;

    if (!userIdPattern.test(userIdRaw)) {
      setFeignError(
        "사번(user_id)은 가입하신 이메일의 @ 앞에 5자리 숫자가 사번 입니다. (맨앞자리 0도 가능, 예: 01001@sk.com 이메일 주소에서 @ 앞의 5자리 숫자를 입력하세요.)",
      );
      setFeignMessage("");
      setFeignResult(null);
      return;
    }

    setFeignLoading(true);
    setFeignError("");
    setFeignMessage("");
    setFeignResult(null);
    try {
      const result = await sampleService.findUserByUserId(userIdRaw);
      setFeignResult(result);
      setFeignMessage("Feign으로 common 사용자(user_id 기준) 정보를 조회했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "조회에 실패했습니다.";
      setFeignError(message);
    } finally {
      setFeignLoading(false);
    }
  }, [feignUserId]);

  const handleDelete = useCallback(async (id: number): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "", message: "" }));
      await sampleService.remove(id);
      setState((prev) => ({
        ...prev,
        loading: false,
        message: "삭제가 완료되었습니다.",
      }));
      await loadItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "삭제에 실패했습니다.";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [loadItems]);

  return (
    <div>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>SCM Sample CRUD Frontend</h1>
        <p className={styles.description}>
          화면의 왼쪽 섹션인 <code className={styles.code}>MyBatis Sample Items</code> 는{" "}
          <code className={styles.code}>aiscm-business-service</code> 의 Sample API 이고, 오른쪽 섹션인{" "}
          <code className={styles.code}>Feign 연동 (business → common)</code> 은{" "}
          <code className={styles.code}>aiscm-business-service</code> 가{" "}
          <code className={styles.code}>aiscm-common-service</code> 의 사용자 API를 호출하는 샘플 입니다.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>MyBatis Sample Items</h2>

          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="name (필수)"
              value={state.name}
              onChange={(event) =>
                setState((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              className={styles.input}
              placeholder="description"
              value={state.description}
              onChange={(event) =>
                setState((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={state.loading}
              onClick={() => void handleSubmit()}
            >
              {state.editId === null ? "등록" : "수정"}
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={state.loading}
              onClick={() => resetForm()}
            >
              초기화
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={state.loading}
              onClick={() => void loadItems()}
            >
              새로고침
            </button>
          </div>

          {state.message ? <p className={styles.message}>{state.message}</p> : null}
          {state.error ? (
            <p className={`${styles.message} ${styles.error}`}>{state.error}</p>
          ) : null}

          <ul className={styles.list}>
            {state.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <p className={styles.itemName}>{item.name}</p>
                  <div className={styles.buttonRow}>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={state.loading}
                      onClick={() => handleEdit(item)}
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={state.loading}
                      onClick={() => void handleDelete(item.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className={styles.itemDesc}>{item.description || "-"}</p>
                <p className={styles.itemMeta}>
                  created: {toLocale(item.createdDate)} / modified: {toLocale(item.lastModifiedDate)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Feign 연동 (business → common)</h2>
          <p className={styles.feignDescription}>
            게이트웨이를 통해{" "}
            <code className={styles.code}>{`GET ${sampleApiPrefix}/feign/users/{userId}`}</code> 를
            호출합니다. 여기서 <code className={styles.code}>{"{userId}"}</code> 는 이메일 @ 앞 5자리 사번(user_id)입니다.
            business가 OpenFeign으로 common의{" "}
            <code className={styles.code}>/api/v1/common/users/by-user-id/{"{userId}"}</code> 를 서버 간 직접 호출합니다.
          </p>
          <div className={`${styles.formRow} ${styles.formRowInline}`}>
            <input
              className={styles.input}
              type="text"
              maxLength={5}
              pattern="[0-9]{5}"
              placeholder="사번 user_id (예: 01001)"
              value={feignUserId}
              onChange={(event) => setFeignUserId(event.target.value)}
            />
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={feignLoading}
              onClick={() => void handleFeignLookup()}
            >
              Feign 사용자 조회
            </button>
          </div>
          {feignMessage ? <p className={styles.message}>{feignMessage}</p> : null}
          {feignError ? (
            <p className={`${styles.message} ${styles.error}`}>{feignError}</p>
          ) : null}
          {feignResult ? (
            <div className={styles.feignResult}>
              <p className={styles.feignSectionTitle}>user (common / Feign)</p>
              <dl>
                <div className={styles.feignRow}>
                  <dt>id (PK)</dt>
                  <dd>{feignResult.id}</dd>
                </div>
                <div className={styles.feignRow}>
                  <dt>user_id (사번)</dt>
                  <dd>{feignResult.userId ?? "-"}</dd>
                </div>
                <div className={styles.feignRow}>
                  <dt>email</dt>
                  <dd>{feignResult.email}</dd>
                </div>
                <div className={styles.feignRow}>
                  <dt>username</dt>
                  <dd>{feignResult.username}</dd>
                </div>
                <div className={styles.feignRow}>
                  <dt>status</dt>
                  <dd>{feignResult.status}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
