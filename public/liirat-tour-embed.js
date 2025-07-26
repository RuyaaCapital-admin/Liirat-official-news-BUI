/**
 * Liirat Site Tour - Embeddable Script
 * Drop this script into any page to enable the site tour
 */

(function () {
  "use strict";

  // Configuration
  const TOUR_CONFIG = {
    autoStart: true,
    storageKey: "liirat-tour-completed",
    language: "auto", // 'auto', 'ar', 'en'
    theme: "auto", // 'auto', 'dark', 'light'
  };

  // Tour steps
  const TOUR_STEPS = {
    ar: [
      {
        target: '[data-tour-target="ticker"]',
        title: "📈 شريط الأسعار المباشر",
        description:
          "تابع أسعار العملات والذهب والنفط والمؤشرات العالمية في الوقت الفعلي",
        position: "bottom",
      },
      {
        target: '[data-tour-target="calendar"]',
        title: "📅 التقويم الاقتصادي",
        description:
          "اطلع على أهم الأحداث الاقتصادية والبيانات المالية القادمة",
        position: "bottom",
      },
      {
        target: '[data-tour-target="alerts"]',
        title: "🔔 التنبيهات الذكية",
        description:
          "احصل على تنبيهات فورية عند صدور البيانات الاقتصادية المهمة",
        position: "bottom",
      },
      {
        target: '[data-tour-target="ai-analysis"]',
        title: "🤖 التحليل الذكي",
        description: "احصل على تحليل فوري بالذكاء الاصطناعي لكل حدث اقتصادي",
        position: "left",
      },
      {
        target: '[data-tour-target="contact"]',
        title: "💬 الدعم والمساعدة",
        description: "تواصل معنا للحصول على الدعم الفني والاستفسارات",
        position: "top",
      },
    ],
    en: [
      {
        target: '[data-tour-target="ticker"]',
        title: "📈 Live Price Ticker",
        description:
          "Track real-time prices of currencies, gold, oil, and global indices",
        position: "bottom",
      },
      {
        target: '[data-tour-target="calendar"]',
        title: "📅 Economic Calendar",
        description:
          "View upcoming economic events and important financial data releases",
        position: "bottom",
      },
      {
        target: '[data-tour-target="alerts"]',
        title: "🔔 Smart Alerts",
        description:
          "Get instant notifications when important economic data is released",
        position: "bottom",
      },
      {
        target: '[data-tour-target="ai-analysis"]',
        title: "🤖 AI Analysis",
        description: "Get instant AI-powered analysis for every economic event",
        position: "left",
      },
      {
        target: '[data-tour-target="contact"]',
        title: "💬 Support & Help",
        description: "Contact us for technical support and inquiries",
        position: "top",
      },
    ],
  };

  // Detect language
  function detectLanguage() {
    if (TOUR_CONFIG.language !== "auto") return TOUR_CONFIG.language;

    const htmlDir = document.documentElement.getAttribute("dir");
    if (htmlDir === "rtl") return "ar";

    const hasArabicText =
      document.body.textContent &&
      (document.body.textContent.includes("التقويم") ||
        document.body.textContent.includes("ليرات"));
    return hasArabicText ? "ar" : "en";
  }

  // Initialize tour
  function initTour() {
    // Check if tour was already completed
    if (localStorage.getItem(TOUR_CONFIG.storageKey)) {
      return;
    }

    // Detect language
    const language = detectLanguage();
    const steps = TOUR_STEPS[language] || TOUR_STEPS.ar;

    // Show welcome dialog
    showWelcomeDialog(language, steps);
  }

  // Show welcome dialog
  function showWelcomeDialog(language, steps) {
    const welcomeTexts = {
      ar: {
        title: "مرحباً بك في ليرات",
        description: "هل تريد جولة سريعة لاكتشاف ميزات المنصة؟",
        startBtn: "ابدأ الجولة",
        skipBtn: "تخطي",
      },
      en: {
        title: "Welcome to Liirat",
        description:
          "Would you like a quick tour to discover the platform features?",
        startBtn: "Start Tour",
        skipBtn: "Skip",
      },
    };

    const texts = welcomeTexts[language] || welcomeTexts.ar;

    // Create welcome dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    `;

    dialog.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937;">
          ${texts.title}
        </h2>
        <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.5;">
          ${texts.description}
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="liirat-start-tour" style="
            background: #16a34a;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          ">${texts.startBtn}</button>
          <button id="liirat-skip-tour" style="
            background: transparent;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
          ">${texts.skipBtn}</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    document.getElementById("liirat-start-tour").onclick = () => {
      document.body.removeChild(dialog);
      startTour(language, steps);
    };

    document.getElementById("liirat-skip-tour").onclick = () => {
      document.body.removeChild(dialog);
      localStorage.setItem(TOUR_CONFIG.storageKey, "true");
    };
  }

  // Start the actual tour
  function startTour(language, steps) {
    let currentStep = 0;
    let tourOverlay;

    function showStep(stepIndex) {
      const step = steps[stepIndex];
      if (!step) {
        completeTour();
        return;
      }

      const target = document.querySelector(step.target);
      if (!target) {
        // Skip to next step if target not found
        setTimeout(() => showStep(stepIndex + 1), 100);
        return;
      }

      // Remove existing overlay
      if (tourOverlay) {
        document.body.removeChild(tourOverlay);
      }

      // Create tour overlay
      tourOverlay = createTourOverlay(
        step,
        target,
        stepIndex,
        steps.length,
        language,
      );
      document.body.appendChild(tourOverlay);

      // Scroll target into view
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function nextStep() {
      currentStep++;
      showStep(currentStep);
    }

    function prevStep() {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    }

    function completeTour() {
      if (tourOverlay) {
        document.body.removeChild(tourOverlay);
      }
      localStorage.setItem(TOUR_CONFIG.storageKey, "true");

      // Show completion message
      showCompletionMessage(language);
    }

    // Start with first step
    showStep(0);

    // Return tour controls
    return { nextStep, prevStep, completeTour };
  }

  // Create tour overlay and callout
  function createTourOverlay(step, target, stepIndex, totalSteps, language) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
    `;

    const rect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;

    // Add dark overlay
    const darkOverlay = document.createElement("div");
    darkOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(1px);
    `;

    // Add highlight
    const highlight = document.createElement("div");
    highlight.style.cssText = `
      position: absolute;
      top: ${rect.top + scrollTop - 4}px;
      left: ${rect.left + scrollLeft - 4}px;
      width: ${rect.width + 8}px;
      height: ${rect.height + 8}px;
      border: 2px solid #16a34a;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 197, 94, 0.8);
      animation: liirat-pulse 2s infinite;
    `;

    // Add callout
    const callout = createCallout(
      step,
      rect,
      stepIndex,
      totalSteps,
      language,
      scrollTop,
      scrollLeft,
    );

    overlay.appendChild(darkOverlay);
    overlay.appendChild(highlight);
    overlay.appendChild(callout);

    // Add pulse animation
    if (!document.getElementById("liirat-tour-styles")) {
      const style = document.createElement("style");
      style.id = "liirat-tour-styles";
      style.textContent = `
        @keyframes liirat-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }

    return overlay;
  }

  // Create callout bubble
  function createCallout(
    step,
    targetRect,
    stepIndex,
    totalSteps,
    language,
    scrollTop,
    scrollLeft,
  ) {
    const callout = document.createElement("div");

    // Calculate position
    let top, left;
    const calloutWidth = 320;
    const calloutHeight = 150;
    const offset = 20;

    switch (step.position) {
      case "bottom":
        top = targetRect.top + scrollTop + targetRect.height + offset;
        left =
          targetRect.left +
          scrollLeft +
          targetRect.width / 2 -
          calloutWidth / 2;
        break;
      case "top":
        top = targetRect.top + scrollTop - calloutHeight - offset;
        left =
          targetRect.left +
          scrollLeft +
          targetRect.width / 2 -
          calloutWidth / 2;
        break;
      case "left":
        top =
          targetRect.top +
          scrollTop +
          targetRect.height / 2 -
          calloutHeight / 2;
        left = targetRect.left + scrollLeft - calloutWidth - offset;
        break;
      case "right":
        top =
          targetRect.top +
          scrollTop +
          targetRect.height / 2 -
          calloutHeight / 2;
        left = targetRect.left + scrollLeft + targetRect.width + offset;
        break;
      default:
        top = window.innerHeight / 2 - calloutHeight / 2;
        left = window.innerWidth / 2 - calloutWidth / 2;
    }

    // Ensure callout stays within viewport
    top = Math.max(10, Math.min(top, window.innerHeight - calloutHeight - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - calloutWidth - 10));

    const navigationTexts = {
      ar: { prev: "السابق", next: "التالي", finish: "إنهاء" },
      en: { prev: "Previous", next: "Next", finish: "Finish" },
    };
    const nav = navigationTexts[language] || navigationTexts.ar;

    callout.style.cssText = `
      position: absolute;
      top: ${top}px;
      left: ${left}px;
      width: ${calloutWidth}px;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 2px solid rgba(34, 197, 94, 0.2);
      pointer-events: auto;
      direction: ${language === "ar" ? "rtl" : "ltr"};
    `;

    callout.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.25rem;">${step.title.split(" ")[0]}</span>
          <span style="
            background: #f3f4f6;
            color: #6b7280;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
          ">${stepIndex + 1} / ${totalSteps}</span>
        </div>
        <button onclick="this.closest('div').dispatchEvent(new CustomEvent('liirat-skip-tour'))" style="
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
        ">✕</button>
      </div>
      <h3 style="font-weight: 600; margin-bottom: 0.5rem; text-align: ${language === "ar" ? "right" : "left"};">
        ${step.title}
      </h3>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; text-align: ${language === "ar" ? "right" : "left"};">
        ${step.description}
      </p>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <button onclick="this.closest('div').dispatchEvent(new CustomEvent('liirat-prev-step'))" 
                ${stepIndex === 0 ? "disabled" : ""} style="
          background: transparent;
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: ${stepIndex === 0 ? "not-allowed" : "pointer"};
          opacity: ${stepIndex === 0 ? "0.5" : "1"};
        ">${nav.prev}</button>
        <button onclick="this.closest('div').dispatchEvent(new CustomEvent('liirat-next-step'))" style="
          background: #16a34a;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        ">${stepIndex === totalSteps - 1 ? nav.finish : nav.next}</button>
      </div>
    `;

    return callout;
  }

  // Show completion message
  function showCompletionMessage(language) {
    const completionTexts = {
      ar: "تمت الجولة بنجاح! استمتع باستخدام ليرات",
      en: "Tour completed! Enjoy using Liirat",
    };

    const message = document.createElement("div");
    message.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;

    message.innerHTML = `
      <span style="color: #16a34a;">✅</span>
      <span style="color: #166534; font-weight: 500;">
        ${completionTexts[language] || completionTexts.ar}
      </span>
    `;

    document.body.appendChild(message);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  // Global tour controls
  window.LiiratTour = {
    start: initTour,
    reset: () => localStorage.removeItem(TOUR_CONFIG.storageKey),
    isCompleted: () => !!localStorage.getItem(TOUR_CONFIG.storageKey),
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initTour, 1000); // Small delay to ensure page is rendered
    });
  } else {
    setTimeout(initTour, 1000);
  }
})();

// Usage examples:
// LiiratTour.start()     - Start tour manually
// LiiratTour.reset()     - Reset tour completion status
// LiiratTour.isCompleted() - Check if tour was completed
