"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authService } from "@/shared/auth/authService";
import { tokenStorage } from "@/shared/auth/tokenStorage";
import SampleCrudDashboard from "@/features/sample/components/SampleCrudDashboard";
import styles from "./SampleAuthGateway.module.css";

export default function SampleAuthGateway() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    setIsAuthenticated(Boolean(token));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStorage.clearAccessToken();
      setIsAuthenticated(false);
      setError("인증이 만료되었습니다. 다시 로그인해 주세요.");
      setMessage("");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const handleSignUp = async (): Promise<void> => {
    if (!email.trim() || !password.trim() || !username.trim()) {
      setError("회원가입은 email/password/username이 모두 필요합니다.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      await authService.signUp({
        email: email.trim(),
        password: password.trim(),
        username: username.trim(),
      });
      setMessage("회원가입이 완료되었습니다. 로그인 버튼으로 토큰을 발급해 주세요.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "회원가입에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError("로그인은 email/password가 필요합니다.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      const token = await authService.login({
        email: email.trim(),
        password: password.trim(),
      });
      tokenStorage.setAccessToken(token);
      setIsAuthenticated(true);
      setMessage("로그인 성공: 토큰 주입이 활성화되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      await authService.logout();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "서버 로그아웃에 실패했습니다. 로컬 토큰은 정리합니다.";
      setError(msg);
    } finally {
      tokenStorage.clearAccessToken();
      setIsAuthenticated(false);
      setMessage("로그아웃되었습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {!isAuthenticated ? (
        <section className={styles.authPanel}>
          <h2 className={styles.authTitle}>인증 설정</h2>
          <p className={styles.authDescription}>
            샘플 API는 인증이 필요합니다. 회원가입 후 로그인하여 토큰을 저장하세요.
          </p>

          <div className={styles.row}>
            <input
              className={styles.input}
              placeholder="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className={styles.input}
              placeholder="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              className={styles.input}
              placeholder="username (signup 전용)"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={loading}
              onClick={() => void handleSignUp()}
            >
              회원가입
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={loading}
              onClick={() => void handleLogin()}
            >
              로그인
            </button>
            <Link href="/proto" className={styles.button}>
              참고
            </Link>
            <Link href="/sample/common" className={styles.button}>
              공통
            </Link>
          </div>

          {message ? <p className={styles.message}>{message}</p> : null}
          {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
        </section>
      ) : (
        <section className={styles.authTopBar}>
          <p>인증 상태: 로그인됨 (Bearer 자동 주입)</p>
          <div className={styles.authTopBarActions}>
            <Link href="/proto" className={styles.button}>
              참고
            </Link>
            <Link href="/sample/common" className={styles.button}>
              공통
            </Link>
            <button type="button" className={styles.button} onClick={() => void handleLogout()}>
              로그아웃
            </button>
          </div>
        </section>
      )}

      {isAuthenticated ? <SampleCrudDashboard /> : null}
    </div>
  );
}
