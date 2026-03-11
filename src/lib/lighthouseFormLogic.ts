/* eslint-disable @typescript-eslint/no-explicit-any */

// Expose window.API_URL for TS
declare global {
  interface Window {
    API_URL?: string;
    __LH_FORM_INIT__?: boolean;
  }
}

/**
 * Initialize Lighthouse form logic on pages that contain the form markup.
 * Call this once in a client component (e.g., inside useEffect).
 */
export function initLighthouseFormLogic(): void {
  if (typeof window === "undefined") return; // SSR safety

  // Prevent double-initialization (e.g., Fast Refresh / client re-mount)
  if ((window as any).__LH_FORM_INIT__) return;
  (window as any).__LH_FORM_INIT__ = true;

  /* ============================================================
     LIGHTHOUSE — FORM LOGIC JS (final unified version)
     ============================================================ */
  (() => {
    /** If you later deploy Cloudflare Worker, replace with its URL */
    // Keeping a null fallback so TS doesn't error when referenced later.
    const ZAPIER_FALLBACK: string | null = null;

    // NOTE: This sets a default endpoint; you can still override window.API_URL
    // in your page.tsx before calling initLighthouseFormLogic if you want.
    const API_URL = (window.API_URL =
      "https://reverse-mortgage.marko-c6c.workers.dev/submit");

    const DUPLICATE_TTL_MS = 10 * 60 * 1000; // 10 mins
    const TIMEOUT_MS = 15000; // 15 secs
    const THANKYOU_DELAY_MS = 1000;

    // Stepper
    const stepper1 = document.getElementById("stepper1") as HTMLElement | null;
    const stepper2 = document.getElementById("stepper2") as HTMLElement | null;
    const stepLineFill = document.getElementById(
      "stepLineFill"
    ) as HTMLElement | null;

    // Sections
    const step1 = document.getElementById("step1") as HTMLElement | null;
    const step2 = document.getElementById("step2") as HTMLElement | null;
    const thankYou = document.getElementById("thankYou") as HTMLElement | null;
    const duplicateMsg = document.getElementById(
      "duplicateMsg"
    ) as HTMLElement | null;

    // Form & controls
    const form = document.getElementById("prequalForm") as HTMLFormElement | null;

    const toStep2 = document.getElementById("toStep2") as HTMLButtonElement | null;
    const backTo1 = document.getElementById("backTo1") as HTMLButtonElement | null;

    // NEW: amount range controls (no more free-text amount input)
    const amountRangeGroup = document.getElementById(
      "amountRangeGroup"
    ) as HTMLElement | null;
    const amountRangeValue = document.getElementById(
      "amountRangeValue"
    ) as HTMLInputElement | null;

    const needGroup = document.getElementById("needGroup") as HTMLElement | null;
    const needValue = document.getElementById(
      "needValue"
    ) as HTMLInputElement | null;

    const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
    const submitBtn = document.getElementById(
      "submitBtn"
    ) as HTMLButtonElement | null;
    const spinner = document.getElementById("spinner") as HTMLElement | null;
    const submitText = document.getElementById("submitText") as HTMLElement | null;
    const submitError = document.getElementById(
      "submitError"
    ) as HTMLElement | null;
    const retryBtn = document.getElementById("retryBtn") as HTMLButtonElement | null;

    const devTools = document.getElementById("devTools") as HTMLElement | null;
    const clearDuplicateLock = document.getElementById(
      "clearDuplicateLock"
    ) as HTMLButtonElement | null;
    const clearRetryQueue = document.getElementById(
      "clearRetryQueue"
    ) as HTMLButtonElement | null;

    // Error map
    const err: Record<string, HTMLElement | null> = {
      homeowner: document.getElementById("err-homeowner"),
      need: document.getElementById("err-need"),
      amount: document.getElementById("err-amount"),
      firstName: document.getElementById("err-firstName"),
      lastName: document.getElementById("err-lastName"),
      email: document.getElementById("err-email"),
      phone: document.getElementById("err-phone"),
    } as Record<string, HTMLElement | null>;

    // Utilities
    const smoothScrollTo = (el: HTMLElement | null | undefined) => {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as any)?.focus?.({ preventScroll: true });
    };
    const parseNumber = (str: string) =>
      Number((str || "").replace(/[^\d]/g, "")) || 0;
    const emailValid = (v: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    /* ============================================================
       FIX: Correct progress bar centering & width for each step
       ============================================================ */
    const setStepper = (step: number) => {
      [stepper1, stepper2].forEach((s) => s?.classList.remove("active"));

      if (step === 1) {
        // Activate Step 1
        stepper1?.classList.add("active");

        // Fill halfway (50%) on step 1
        if (stepLineFill) {
          stepLineFill.style.width = "50%";
          stepLineFill.setAttribute("aria-valuenow", "50");
        }

        // Optional accessibility marker for CSS
        document.querySelector(".stepper")?.setAttribute("data-step", "1");
      }

      if (step === 2) {
        // Activate Step 2
        stepper2?.classList.add("active");

        // Fill full width (100%) on step 2
        if (stepLineFill) {
          stepLineFill.style.width = "100%";
          stepLineFill.setAttribute("aria-valuenow", "100");
        }

        // Update CSS hook
        document.querySelector(".stepper")?.setAttribute("data-step", "2");
      }
    };

    const showStep = (n: number) => {
      if (!step1 || !step2 || !thankYou || !duplicateMsg) return;
      if (n === 1) {
        step1.classList.remove("hidden");
        step2.classList.add("hidden");
        thankYou.classList.add("hidden");
        duplicateMsg.classList.add("hidden");
        setStepper(1);
      } else {
        step1.classList.add("hidden");
        step2.classList.remove("hidden");
        setStepper(2);
      }
    };

    /* ============================================================
       FEATURE: Suggested Amount Ranges (buttons)
       - Handled via amountRangeGroup + amountRangeValue
       ============================================================ */

    // Mortgage need card select (existing behaviour)
    if (needGroup && needValue) {
      needGroup.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        const card = target.closest(".card-radio") as HTMLElement | null;
        if (!card) return;
        [...needGroup.querySelectorAll(".card-radio")].forEach((c) =>
          (c as HTMLElement).setAttribute("aria-checked", "false")
        );
        card.setAttribute("aria-checked", "true");
        needValue.value = (card as any).dataset.value || "";
      });
    }

    // NEW: amount range card select
    if (amountRangeGroup && amountRangeValue) {
      amountRangeGroup.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        const card = target.closest(".amount-card") as HTMLElement | null;
        if (!card) return;

        // Clear previous selection
        [...amountRangeGroup.querySelectorAll(".amount-card")].forEach((c) =>
          (c as HTMLElement).setAttribute("aria-checked", "false")
        );

        // Mark this one active
        card.setAttribute("aria-checked", "true");

        // Store numeric anchor value in hidden input
        amountRangeValue.value = (card as any).dataset.value || "";
      });
    }

    // Phone formatting
    if (phoneInput) {
      phoneInput.addEventListener("input", (e: Event) => {
        const el = e.target as HTMLInputElement;
        const digits = el.value.replace(/\D/g, "").slice(0, 15);
        let out = "";
        if (digits.length <= 3) out = digits;
        else if (digits.length <= 6)
          out = digits.slice(0, 3) + "-" + digits.slice(3);
        else
          out =
            digits.slice(0, 3) +
            "-" +
            digits.slice(3, 6) +
            "-" +
            digits.slice(6);
        el.value = out;
        (el as any).dataset.digits = digits;
      });
    }

    const invalidate = (
      id: string,
      message: string,
      inputEl?: HTMLElement | null
    ) => {
      const el = err[id];
      if (!el) return;
      el.textContent = message;
      el.classList.remove("hidden");
      (inputEl as any)?.classList?.add?.("border-red-500", "error-ring");
      smoothScrollTo(inputEl || el);
    };

    const clearAllErrors = () => {
      Object.values(err).forEach((e) => e?.classList.add("hidden"));
      document
        .querySelectorAll(".error-ring")
        .forEach((el) => el.classList.remove("error-ring"));
      document
        .querySelectorAll(".border-red-500")
        .forEach((el) => el.classList.remove("border-red-500"));
    };

    const validateStep1 = () => {
      if (!form || !needGroup) return false;
      clearAllErrors();
      let ok = true;

     /** const homeowner = form.querySelector(
        'input[name="homeowner"]:checked'
      ) as HTMLInputElement | null;
      if (!homeowner) {
        invalidate(
          "homeowner",
          "Please choose an option.",
          form.querySelector('input[name="homeowner"]') as HTMLElement
        );
        ok = false;
      } */

      if (!needValue?.value) {
        invalidate("need", "Please select one option.", needGroup);
        ok = false;
      }

      const amt = amountRangeValue?.value
        ? parseNumber(amountRangeValue.value)
        : 0;
      if (!amt) {
        invalidate(
          "amount",
          "Please select an amount range.",
          amountRangeGroup || undefined
        );
        ok = false;
      }

      return ok;
    };

    const validateStep2 = () => {
      let ok = true;
      const firstName = document.getElementById(
        "firstName"
      ) as HTMLInputElement | null;
      const lastName = document.getElementById(
        "lastName"
      ) as HTMLInputElement | null;
      const email = document.getElementById(
        "email"
      ) as HTMLInputElement | null;
      const phone = document.getElementById(
        "phone"
      ) as HTMLInputElement | null;

      if (!firstName?.value.trim()) {
        invalidate("firstName", "First name is required.", firstName);
        ok = false;
      }
      if (!lastName?.value.trim()) {
        invalidate("lastName", "Last name is required.", lastName);
        ok = false;
      }
      if (!emailValid(email?.value.trim() || "")) {
        invalidate("email", "Enter a valid email.", email || undefined);
        ok = false;
      }
      const digits =
        ((phone as any)?.dataset?.digits as string) ||
        (phone?.value.replace(/\D/g, "") || "");
      if (!digits || digits.length < 10) {
        invalidate("phone", "Enter at least 10 digits.", phone || undefined);
        ok = false;
      }
      return ok;
    };

    toStep2?.addEventListener("click", () => {
      if (validateStep1()) showStep(2);
    });

    backTo1?.addEventListener("click", () => showStep(1));

    // Duplicate prevention
    const duplicateKey = "lh_prequal_fingerprint";
    const now = () => Date.now();

    async function sha256Hex(str: string): Promise<string> {
      const enc = new TextEncoder().encode(str);
      const digest = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const readDuplicateLock = (): { fingerprint?: string; ts?: number } => {
      try {
        return JSON.parse(localStorage.getItem(duplicateKey) || "{}");
      } catch {
        return {};
      }
    };

    const writeDuplicateLock = (fingerprint: string) =>
      localStorage.setItem(
        duplicateKey,
        JSON.stringify({ fingerprint, ts: now() })
      );

    // Retry queue
    const queueKey = "lh_failedSubmissions";
    const readQueue = (): Array<{ payload: any; err: string; ts: number }> => {
      try {
        return JSON.parse(localStorage.getItem(queueKey) || "[]");
      } catch {
        return [];
      }
    };
    const writeQueue = (
      arr: Array<{ payload: any; err: string; ts: number }>
    ) => localStorage.setItem(queueKey, JSON.stringify(arr.slice(0, 50)));

    const enqueueFailed = (payload: any, err: unknown) => {
      const arr = readQueue();
      arr.unshift({ payload, err: String(err), ts: now() });
      writeQueue(arr);
    };

    // Dev tools
    const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (isDev) {
      devTools?.classList.remove("hidden");
      clearDuplicateLock?.addEventListener("click", () => {
        localStorage.removeItem(duplicateKey);
        alert("Duplicate lock cleared");
      });
      clearRetryQueue?.addEventListener("click", () => {
        localStorage.removeItem(queueKey);
        alert("Retry queue cleared");
      });
    }

    const setSubmitting = (state: boolean) => {
      if (submitBtn) submitBtn.disabled = state;
      if (spinner) spinner.classList.toggle("hidden", !state);
      if (submitText) submitText.textContent = state ? "Sending…" : "Submit";
    };

    /** UTM Tracking **/
    function captureUTMs() {
      const params = new URLSearchParams(window.location.search);
      const get = (k: string) => params.get(k) || "";
      const ref = params.get("referrer") || document.referrer || "";
      const map: Record<string, string> = {
        utm_source: "utm_source",
        utm_medium: "utm_medium",
        utm_campaign: "utm_campaign",
        utm_term: "utm_term",
        utm_content: "utm_content",
        utm_id: "utm_id",
        gclid: "gclid",
        fbclid: "fbclid",
        referrer: "referrer",
      };
      Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        el.value = key === "referrer" ? ref : get(key);
      });
      return {
        utm_source: get("utm_source"),
        utm_medium: get("utm_medium"),
        utm_campaign: get("utm_campaign"),
        utm_term: get("utm_term"),
        utm_content: get("utm_content"),
        utm_id: get("utm_id"),
        gclid: get("gclid"),
        fbclid: get("fbclid"),
        referrer: ref,
      };
    }
    const __UTM_OBJ__ = captureUTMs();

    const buildPayload = () => {
      if (!form || !needValue || !phoneInput) return {};
      const homeowner =
        (
          form.querySelector(
            'input[name="homeowner"]:checked'
          ) as HTMLInputElement | null
        )?.value || "";

      const amountNum = amountRangeValue?.value
        ? parseNumber(amountRangeValue.value)
        : 0;

      const phoneDigits =
        ((phoneInput as any).dataset?.digits as string) ||
        phoneInput.value.replace(/\D/g, "");

      const firstName =
        (
          document.getElementById("firstName") as HTMLInputElement | null
        )?.value.trim() || "";
      const lastName =
        (
          document.getElementById("lastName") as HTMLInputElement | null
        )?.value.trim() || "";
      const email =
        (
          document.getElementById("email") as HTMLInputElement | null
        )?.value.trim() || "";

      return {
        company: "Lighthouse Lending",
        homeowner,
        mortgage_need: needValue.value,
        amount: amountNum, // e.g., 25000 / 50000 / 100000 / 250000
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phoneDigits,
        timestamp: new Date().toISOString(),
        ...(__UTM_OBJ__ || {}),
      };
    };

    async function postWithTimeout(url: string, data: unknown) {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: ctrl.signal,
        });
        window.clearTimeout(t);
        if (!resp.ok) throw new Error("Non-2xx: " + resp.status);
        return (await resp.json().catch(() => ({ ok: true }))) as unknown;
      } catch (e) {
        window.clearTimeout(t);
        throw e;
      }
    }

    async function trySubmit(payload: any) {
      console.log("submitAttempt", payload);
      setSubmitting(true);
      submitError?.classList.add("hidden");
      const target = API_URL || ZAPIER_FALLBACK;
      try {
        if (!target) throw new Error("No submission endpoint configured");
        const r = await postWithTimeout(target, payload);
        console.log("submitSuccess", r);
        setSubmitting(false);
        step1?.classList.add("hidden");
        step2?.classList.add("hidden");
        duplicateMsg?.classList.add("hidden");
        thankYou?.classList.remove("hidden");

        window.setTimeout(() => {
          const THANK_YOU_URL =
            "https://www.lighthouselending.ca/thank-you-page";

          // Open in a new tab
          window.open(THANK_YOU_URL, "_top");
        }, THANKYOU_DELAY_MS);

        return true;
      } catch (e) {
        console.log("submitFailure", String(e));
        enqueueFailed(payload, e);
        setSubmitting(false);
        submitError?.classList.remove("hidden");
        return false;
      }
    }

    retryBtn?.addEventListener("click", async () => {
      const last = readQueue()[0];
      if (!last) return alert("No queued item to retry.");
      await trySubmit(last.payload);
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateStep2()) return;
      const payload = buildPayload();
      const fingerprint = await sha256Hex(JSON.stringify(payload));
      const lock = readDuplicateLock();
      if (lock.fingerprint === fingerprint && now() - (lock.ts || 0) < DUPLICATE_TTL_MS) {
        console.log("duplicateBlocked", fingerprint);
        step1?.classList.add("hidden");
        step2?.classList.add("hidden");
        thankYou?.classList.add("hidden");
        duplicateMsg?.classList.remove("hidden");
        return;
      }
      const ok = await trySubmit(payload);
      if (ok) writeDuplicateLock(fingerprint);
    });

    // init
    showStep(1);
    stepper1?.classList.add("active");
  })();
}
