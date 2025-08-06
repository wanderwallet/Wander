import React from "react";
import browser from "webextension-polyfill";

export const DegradedMessage: React.ReactNode = (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "14px" }}>{browser.i18n.getMessage("ao_degraded")}</div>
    <div style={{ fontSize: "12px", color: "#a3a3a3" }}>
      {browser.i18n
        .getMessage("ao_degraded_description")
        .split("<br/>")
        .map((msg, index) => (
          <div key={`ao_degraded_${index}`}>{msg}</div>
        ))}
    </div>
  </div>
);

export const NetworkErrorMessage: React.ReactNode = (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "14px" }}>{browser.i18n.getMessage("network_issue")}</div>
    <div style={{ fontSize: "12px", color: "#a3a3a3" }}>
      {browser.i18n
        .getMessage("network_issue_description")
        .split("<br/>")
        .map((msg, index) => (
          <div key={`network_issue_${index}`}>{msg}</div>
        ))}
    </div>
  </div>
);
