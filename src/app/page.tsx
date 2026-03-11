"use client";

import { useEffect } from "react";
import { initLighthouseFormLogic } from "@/lib/lighthouseFormLogic";

export default function LighthouseFormPage() {
  useEffect(() => {
  // Cloudflare Worker endpoint (executed on client side only)
  window.API_URL = "https://reverse-mortgage-fb.marko-c6c.workers.dev";

  // Initialize Lighthouse logic
  initLighthouseFormLogic();
}, []);

// --- NEW useEffect: Receive UTMs from Webflow ---
useEffect(() => {
 function handleMessage(e: MessageEvent<any>) {
    if (!e.data || e.data.type !== "UTM_DATA") return;

    const utms = e.data.payload || {};
    const search = new URLSearchParams(window.location.search);
    let changed = false;

    // Put UTMs into hidden fields + URL
    Object.entries(utms).forEach(([key, value]) => {
      if (!value) return;

      // Update browser URL
      if (!search.has(key)) {
        search.set(key, String(value));
        changed = true;
      }

      // Update matching hidden input
      const el = document.getElementById(key) as HTMLInputElement | null;
    if (el) {
      el.value = String(value);
    }

    });

    // Apply updated URL
    if (changed) {
      const newUrl =
        window.location.pathname +
        "?" +
        search.toString() +
        window.location.hash;

      window.history.replaceState({}, "", newUrl);
    }
  }

  window.addEventListener("message", handleMessage);

  // Ask parent (Webflow) for the UTMs
  try {
    window.parent.postMessage("REQUEST_UTM_DATA", "*");
  } catch {
    /* not inside Webflow */
  }

  return () => window.removeEventListener("message", handleMessage);
}, []);




// 5) Tell Webflow (parent) the current height so iframe can auto-resize
  useEffect(() => {
    function sendHeight() {
      // Full page height of the app
      const height = document.documentElement.scrollHeight;
      try {
        window.parent.postMessage(
          { type: "LH_IFRAME_HEIGHT", height },
          "*"
        );
      } catch {
        // not in iframe, ignore
      }
    }

    // Initial
    sendHeight();

    // Observe size changes in the body
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

    // --- NEW: Scroll to top of form on Next / Back ---
  useEffect(() => {
    function scrollToFormTop() {
      const el = document.getElementById("lhFormTop");
      if (!el) return;

      // small delay so step change has applied
      setTimeout(() => {
        el.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }, 30);
    }

    const toStep2 = document.getElementById("toStep2");
    const backTo1 = document.getElementById("backTo1");

    if (toStep2) {
      toStep2.addEventListener("click", scrollToFormTop);
    }
    if (backTo1) {
      backTo1.addEventListener("click", scrollToFormTop);
    }

    // cleanup on unmount
    return () => {
      if (toStep2) {
        toStep2.removeEventListener("click", scrollToFormTop);
      }
      if (backTo1) {
        backTo1.removeEventListener("click", scrollToFormTop);
      }
    };
  }, []);


  return (
    <html lang="en">
      <head>
        {/* Head helpers */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>No Obligation Pre-Approval</title>
      </head>

      <body>
        <header className="w-full border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.prod.website-files.com/6754261c83063c4b66a2ec08/6866892f7dca044a867432a6_LighthouseLending-RemadeLogo-2025-Navy%403x.webp"
                alt="Lighthouse Lending"
                className="h-9 w-auto"
                loading="eager"
              />
            </div>
            <span className="hidden sm:block text-sm text-slate-500">
              Secure &amp; Private · No hard credit check
            </span>
          </div>
          
        </header>

        <main id="lhFormTop" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <h1
            className="text-center text-3xl sm:text-4xl font-bold mb-8"
            style={{ color: "var(--brand-navy)" }}
          >
          No Obligation Pre-Approval
          </h1>

          {/* Progress */}
          <div className="stepper" aria-label="Form progress">


              <div className="step-line" aria-hidden="true"></div>
              <div
                id="stepLineFill"
                className="step-line-fill"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={50}
              ></div>

              <div className="step" id="stepper1">
                <div className="circle text-xs font-bold text-slate-800">1</div>
                <div className="label">Step 1</div>
              </div>

              <div className="step" id="stepper2">
                <div className="circle text-xs font-bold text-slate-800">2</div>
                <div className="label">Step 2</div>
              </div>

            </div>


          <section className="section-grid">
            {/* LEFT PANEL */}
            <aside className="left-panel h-match rounded-2xl overflow-hidden text-white">
              <div className="brand-gradient flex flex-col justify-between h-full p-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                    Fast, friendly, and flexible
                  </h2>
                  <p className="mb-6 text-slate-100">
                    Tell us a bit about your needs and we’ll match you with the
                    right option. No obligation.
                  </p>
                  <ul className="space-y-4 text-base text-slate-100">
                    <li className="flex items-center gap-2">
                      <span className="icon-dot"></span> Works for homeowners in
                      Ontario
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="icon-dot"></span> HELOC, refinance,
                      renewal &amp; more
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="icon-dot"></span> Bank-grade security
                    </li>
                  </ul>
                </div>
                <div className="footer-note text-sm mt-10 text-slate-200">
                  © Lighthouse Lending
                </div>
              </div>
            </aside>

            {/* RIGHT PANEL (FORM) */}
            <div className="h-match">
              <form id="prequalForm" className="h-full flex flex-col gap-6">
                {/* STEP 1 */}
                <div
                  id="step1"
                  className="card p-6 sm:p-8 space-y-6 slide-fade-enter-active"
                >
                  {/* Q1 */}
                 {/**  <fieldset
                    className="space-y-2"
                    aria-describedby="homeownerHelp"
                  >
                    <legend
                      className="text-base font-semibold"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      Are you a homeowner in Ontario?{" "}
                      <span className="text-red-600">*</span>
                    </legend>
                    <div
                      className="flex flex-wrap gap-6 mt-2"
                      role="radiogroup"
                      aria-label="Homeowner in Ontario"
                    >
                      <label className="custom-radio">
                      <input type="radio" name="homeowner" value="Yes" />
                      <span>Yes</span>
                    </label>

                      <label className="custom-radio">
                      <input type="radio" name="homeowner" value="No" />
                      <span>No</span>
                    </label>
                    </div>
                    <p
                      className="mt-1 text-sm text-red-600 hidden"
                      id="err-homeowner"
                    ></p>
                  </fieldset> */}

                  {/* Q2 */}
                  <fieldset className="space-y-3" aria-describedby="needHelp">
                    <legend
                      className="text-base font-semibold"
                      style={{ color: "var(--brand-navy)" }}
                    >
                     What is your main goal?{" "}
                      <span className="text-red-600">*</span>
                    </legend>
                    <p id="needHelp" className="text-sm text-slate-500">
                      Choose one.
                    </p>

                    <div
                      id="needGroup"
                      //className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      className="grid grid-cols-2 gap-3"
                      role="radiogroup"
                      aria-label="Mortgage needs"
                    >

                      {/* Card buttons */}
                      <button
                        type="button"
                        className="card-radio equal-card"
                        data-value="Consolidate My Debt"
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="currentColor"
                            d="M3 6h18v2H3V6zm2 5h14v2H5v-2zm3 5h8v2H8v-2z"
                          />
                        </svg>
                        <div>
                          <div className="font-semibold text-navy">
                            Consolidate My Debt
                          </div>
                          <div className="text-xs text-slate-500">
                            
                          </div>
                        </div>
                      </button>

                     <button type="button"
                        className="card-radio equal-card"
                        data-value="Pay Off Existing Mortgage"
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="currentColor"
                            d="M12 3l8 6v12h-5v-6H9v6H4V9l8-6zm-1 10l-2-2 1.4-1.4L11 10.2l3.6-3.6L16 8l-5 5z"
                          />
                        </svg>

                        <div>
                          <div className="font-semibold text-navy">Pay Off Existing Mortgage</div>
                          <div className="text-xs text-slate-500"></div>
                        </div>
                      </button>


                            <button
                              type="button"
                              className="card-radio equal-card"
                              data-value="Eliminate Mortgage Payments"
                            >
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fill="currentColor"
                                  d="M12 3l8 6v12H4V9l8-6zm-3.7 8.3l1.4-1.4L12 11.2l2.3-2.3 1.4 1.4L13.4 12l2.3 2.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4L10.6 12l-2.3-2.3z"
                                />
                              </svg>

                              <div>
                                <div className="font-semibold text-navy">Eliminate Mortgage Payments</div>
                                <div className="text-xs text-slate-500"></div>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="card-radio equal-card"
                              data-value="Other"
                            >
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fill="currentColor"
                                  d="M5 10.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3z"
                                />
                              </svg>

                              <div>
                                <div className="font-semibold text-navy">Other</div>
                                <div className="text-xs text-slate-500"></div>
                              </div>
                            </button>


                    </div>
                    <input type="hidden" id="needValue" name="mortgage_need" />
                    <p
                      className="mt-1 text-sm text-red-600 hidden"
                      id="err-need"
                    ></p>
                  </fieldset>

                 
{/* Q3 – Amount range buttons */}
<div className="space-y-2 relative z-20">
  <label
    className="text-base font-semibold"
    style={{ color: "var(--brand-navy)" }}
  >
    What’s the amount you have in mind?{" "}
    <span className="text-red-600">*</span>
  </label>
  <p id="amountHelp" className="text-sm text-slate-500">
    An estimate is fine — just choose the closest range.
  </p>

  {/* 4 buttons in a 2x2 grid */}
  <div
    id="amountRangeGroup"
    className="grid grid-cols-2 gap-3"
    role="radiogroup"
    aria-label="Amount range"
  >
    <button
      type="button"
      className="card-radio equal-card amount-card bg-white"
      data-value="25000"
    >
      <div className="font-semibold text-navy">$100,000-$250,000</div>
    </button>

    <button
      type="button"
      className="card-radio equal-card amount-card bg-white"
      data-value="50000"
    >
      <div className="font-semibold text-navy">$250,000-$500,000</div>
    </button>

    <button
      type="button"
      className="card-radio equal-card amount-card bg-white"
      data-value="100000"
    >
      <div className="font-semibold text-navy">$500,000-$1,000,000</div>
    </button>

    <button
      type="button"
      className="card-radio equal-card amount-card bg-white"
      data-value="250000"
    >
      <div className="font-semibold text-navy">$1,000,000+</div>
    </button>
  </div>

  {/* Hidden field that actually stores the numeric value */}
  <input type="hidden" id="amountRangeValue" name="amount" />

  <p
    className="mt-1 text-sm text-red-600 hidden"
    id="err-amount"
  ></p>
</div>


                  

                  <div className="flex justify-end">
                    <button
                      id="toStep2"
                      type="button"
                      className="brand-btn-primary"
                    >
                      Continue →
                    </button>
                  </div>
                </div>

                {/* STEP 2 */}
                <div
                  id="step2"
                  className="card p-6 sm:p-8 space-y-6 hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block font-medium"
                      >
                        First Name{" "}
                        <span className="text-red-600">*</span>
                        <p id="amountHelp"
                      className="text-sm text-slate-500">Please enter your legal first name.</p>
                      </label>
                      <input
                        id="firstName"
                        name="first_name"
                        placeholder="John"
                        className="mt-1 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-4 ring-blue-100"
                        aria-describedby="err-firstName"
                      />
                      <p
                        className="mt-1 text-sm text-red-600 hidden"
                        id="err-firstName"
                      ></p>
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block font-medium"
                      >
                        Last Name{" "}
                        <span className="text-red-600">*</span>
                        <p id="amountHelp"
                      className="text-sm text-slate-500">Please enter your legal last name.</p>
                      </label>
                      <input
                        id="lastName"
                        name="last_name"
                        placeholder="Doe"
                        className="mt-1 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-4 ring-blue-100"
                        aria-describedby="err-lastName"
                      />
                      <p
                        className="mt-1 text-sm text-red-600 hidden"
                        id="err-lastName"
                      ></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block font-medium"
                      >
                        Email{" "}
                        <span className="text-red-600">*</span>
                        <p id="amountHelp"
                      className="text-sm text-slate-500">Provide an email address you check frequently.</p>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="johndoe@email.com"
                        className="mt-1 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-4 ring-blue-100"
                        aria-describedby="err-email"
                      />
                      <p
                        className="mt-1 text-sm text-red-600 hidden"
                        id="err-email"
                      ></p>
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block font-medium"
                      >
                        Phone{" "}
                        <span className="text-red-600">*</span>
                        <p id="amountHelp"
                      className="text-sm text-slate-500">Enter the best number to reach you.
</p>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        inputMode="tel"
                        placeholder="123-456-7890"
                        className="mt-1 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-4 ring-blue-100"
                        aria-describedby="err-phone"
                      />
                      <p className="mt-1 text-sm text-slate-500">
                      </p>
                      <p
                        className="mt-1 text-sm text-red-600 hidden"
                        id="err-phone"
                      ></p>
                    </div>

                    {/* Hidden UTM fields */}
                    <input type="hidden" id="utm_source" name="utm_source" />
                    <input type="hidden" id="utm_medium" name="utm_medium" />
                    <input type="hidden" id="utm_campaign" name="utm_campaign" />
                    <input type="hidden" id="utm_term" name="utm_term" />
                    <input type="hidden" id="utm_content" name="utm_content" />
                    <input type="hidden" id="utm_id" name="utm_id" />
                    <input type="hidden" id="gclid" name="gclid" />
                    <input type="hidden" id="fbclid" name="fbclid" />
                    <input type="hidden" id="referrer" name="referrer" />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      id="backTo1"
                      type="button"
                      className="brand-btn-secondary"
                    >
                      ← Back
                    </button>
                    <button
                      id="submitBtn"
                      type="submit"
                      className="brand-btn-primary disabled:opacity-50"
                    >
                      <span id="submitText">Submit</span>
                      <svg
                        id="spinner"
                        className="animate-spin hidden"
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          opacity=".25"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    id="submitError"
                    className="hidden mt-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3"
                  >
                    There was an issue sending your request. You can try again
                    now, or later. The attempt has been saved locally.
                    <div className="mt-2">
                      <button
                        id="retryBtn"
                        type="button"
                        className="text-sm underline"
                      >
                        Retry now
                      </button>
                    </div>
                  </div>

                  <div
                    id="devTools"
                    className="hidden mt-3 text-xs text-slate-500"
                  >
                    <button
                      id="clearDuplicateLock"
                      type="button"
                      className="underline"
                    >
                      Dev: Clear duplicate lock
                    </button>
                    <span className="mx-2">·</span>
                    <button
                      id="clearRetryQueue"
                      type="button"
                      className="underline"
                    >
                      Dev: Clear retry queue
                    </button>
                  </div>
                </div>

                {/* THANK YOU */}
                <div
                  id="thankYou"
                  className="hidden card p-8 text-center"
                >
                  <div className="brand-check">✓</div>
                  <h3 className="title">
                    Thanks! We’ve received your details.
                  </h3>
                  <p className="subtitle">
                    A mortgage specialist from Lighthouse Lending will be in
                    touch shortly.
                  </p>
                </div>

                <div
                  id="duplicateMsg"
                  className="hidden card p-8 text-center text-amber-700"
                >
                  <h3 className="text-lg font-semibold mb-1">
                    We’ve already received this submission — thanks!
                  </h3>
                  <p className="text-sm">
                    If you need to make a change, tweak a field and try again.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
