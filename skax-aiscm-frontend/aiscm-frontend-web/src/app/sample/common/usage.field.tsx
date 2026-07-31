"use client";

import { useState } from "react";

import Field from "@/shared/ui/Field/Field";
import { Input, InputAction } from "@/shared/ui/Field/Input";
import Dropdown from "@/shared/ui/Field/Dropdown";
import Checkbox from "@/shared/ui/Field/Checkbox";
import RadioGroup from "@/shared/ui/Field/RadioGroup";

import styles from "./usagePublic.module.css";

type SampleFormState = {
  name: string;
  email: string;
  agree: boolean;
  gender: string;
};

export default function InputBoxUsageExample() {
  const [form, setForm] = useState<SampleFormState>({
    name: "",
    email: "",
    agree: false,
    gender: "",
  });

  const updateField = <K extends keyof SampleFormState>(key: K, value: SampleFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
    
  return (
    <>
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Dropdown
          </h3>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
              <Dropdown
                placeholder="선택하세요"
                options={[
                  "op1",
                  "op2",
                  "op3",
                ]}
              />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Field
          </h3>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <Field
              label="이름"
            >
              <Input
                placeholder="이름 입력"
                clearable
              />
            </Field>

            <Field
              label="검색"
              helperText="ㅇㅇ 입력하세요"
              size="lg"
              required
              className="aaa"
              htmlFor="userName"
            >
              <Input
                id="userName"
                placeholder="검색어"
                clearable
                action={
                  <InputAction>
                    검색
                  </InputAction>
                }
              />
            </Field>
            <Field
              label="비밀번호"
            >
              <Input
                type="password"
                placeholder="비밀번호 입력"
                clearable
              />
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="옵션 선택">
              <Dropdown
                options={[
                  "op1",
                  "op2",
                  "op3",
                ]}
              />
              <Input
                placeholder="이름 입력"
                clearable
              />
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="옵션 선택">
              <Dropdown
                options={[
                  "op1",
                  "op2",
                  "op3",
                ]}
              />
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="약관 동의">
              <Checkbox
                id="agree"
                name="agree"
                checked={form.agree}
                onChange={(v) =>
                  updateField(
                    "agree",
                    v
                  )
                }
                label="동의합니다"
              />
            </Field>

            <Field label="성별">
              <RadioGroup
                name="gender"
                value={form.gender}
                onChange={(v) =>
                  updateField(
                    "gender",
                    v
                  )
                }
                options={[
                  {
                    label: "남자",
                    value: "M",
                  },
                  {
                    label: "여자",
                    value: "F",
                  },
                ]}
              />
            </Field>
          </div>
        </div>
      </section>

    </>
  );
}
