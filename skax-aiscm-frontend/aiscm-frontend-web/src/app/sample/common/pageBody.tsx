"use client";

import { useState } from "react";
import TabForm from "./tabForm";
import TabIcon from "./tabIcon";
import TabBadge from "./tabBadge";

import styles from "./pageBody.module.css";

export default function SampleCommonPageBody() {
  const [activeTab, setActiveTab] = useState("tabForm");

  const tabs = [
    { id: "tabForm", label: "Form", component: TabForm },
    { id: "tabIcon", label: "Icon", component: TabIcon },
    { id: "tabBadge", label: "Badge", component: TabBadge },
  ];

  const ActiveObj = tabs.find(
    (tab) => tab.id === activeTab
  )?.component;

  return (
    <div className={styles.tabWrap}>
      {/* 탭 버튼 */}
      <div className={styles.tabHeader}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? `${styles.tabButton} ${styles.tabButtonActive}` : `${styles.tabButton}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className={styles.tabContents}>
        {ActiveObj && <ActiveObj />}
      </div>
    </div>
  );
}
