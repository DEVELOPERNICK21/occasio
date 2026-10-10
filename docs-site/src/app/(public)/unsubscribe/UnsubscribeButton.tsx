"use client";

import { useState } from "react";

type State = "idle" | "working" | "done" | "error";

export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");

  async function unsubscribe() {
    setState("working");
    try {
      const res = await fetch(`/api/v1/email/unsubscribe?t=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-[var(--ink)]">
        You are unsubscribed. We will not email this address again.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="landing-btn-primary"
        onClick={unsubscribe}
        disabled={state === "working"}
      >
        {state === "working" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {state === "error" ? (
        <p role="alert" className="text-sm text-[var(--error)]">
          That did not work. The link may be old, or you may be offline. Please try again, or
          email us and we will remove you by hand.
        </p>
      ) : null}
    </div>
  );
}
