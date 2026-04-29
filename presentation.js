const slides = Array.from(document.querySelectorAll(".slide"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("pageIndicator");
const progressBar = document.getElementById("progressBar");

let current = 0;
let isTransitioning = false;

function observeReveals(slide) {
  const revealItems = slide.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.15 }
  );
  revealItems.forEach((item, idx) => {
    item.classList.remove("visible");
    item.style.transitionDelay = `${idx * 70}ms`;
    observer.observe(item);
  });
}

function renderSlide() {
  slides.forEach((s, i) => {
    s.classList.toggle("active", i === current);
    if (i === current) {
      s.style.opacity = "";
      s.style.transform = "";
    }
  });
  observeReveals(slides[current]);
  pageIndicator.textContent = `${current + 1} / ${slides.length}`;
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
}

function navigateTo(index) {
  if (isTransitioning || index < 0 || index >= slides.length || index === current) return;
  isTransitioning = true;
  const activeSlide = slides[current];
  activeSlide.style.opacity = "0";
  activeSlide.style.transform = "translateY(12px) scale(0.99)";
  setTimeout(() => {
    current = index;
    renderSlide();
    isTransitioning = false;
  }, 180);
}

prevBtn.addEventListener("click", () => {
  navigateTo(current - 1);
});

nextBtn.addEventListener("click", () => {
  navigateTo(current + 1);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextBtn.click();
  if (e.key === "ArrowLeft") prevBtn.click();
});

function pickClusterRow(profiles, clusterName) {
  return profiles.find((p) => p.cluster === clusterName);
}

const chartStore = {};

function buildChart(canvasId, row, features, title, mode = "radar") {
  const labels = [
    "Social Hours",
    "Procrastination Frequency",
    "Worries",
    "Energy",
    "Sleep Hours",
    "Intentional Delay",
  ];
  const values = features.map((f) => row[f]);
  const chartType = mode === "bar" ? "bar" : "radar";
  const canvas = document.getElementById(canvasId);

  if (chartStore[canvasId]) {
    chartStore[canvasId].destroy();
  }

  chartStore[canvasId] = new Chart(canvas, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        borderColor: "#2e6fe8",
        backgroundColor: mode === "bar" ? "rgba(46, 111, 232, 0.75)" : "rgba(46, 111, 232, 0.25)",
        borderWidth: 2,
        pointBackgroundColor: "#ff9f43",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutCubic",
      },
      plugins: {
        legend: { display: true, labels: { color: "#223" } },
      },
      scales: {
        r: chartType === "radar" ? {
          beginAtZero: true,
          suggestedMax: 10,
          ticks: { backdropColor: "transparent", color: "#333" },
          pointLabels: { color: "#333" },
        } : undefined,
        y: chartType === "bar" ? {
          beginAtZero: true,
          suggestedMax: 10,
          ticks: { color: "#333" },
        } : undefined,
        x: chartType === "bar" ? {
          ticks: { color: "#333", maxRotation: 20, minRotation: 0 },
        } : undefined,
      },
    },
  });
}

async function loadAndBuildClusterCharts() {
  const res = await fetch("storytelling_outputs/09_website_data.json");
  const data = await res.json();

  const features = data.profile_features;
  const insights = data.insights;
  const profiles = data.profiles;

  const map = [
    ["Anxious Avoider", "chart-anxious", "insight-anxious"],
    ["Distracted Scroller", "chart-distracted", "insight-distracted"],
    ["Selective Procrastinator", "chart-selective", "insight-selective"],
    ["Thrill Seeker", "chart-thrill", "insight-thrill"],
    ["Tired One", "chart-tired", "insight-tired"],
  ];

  map.forEach(([clusterName, canvasId, insightId]) => {
    const row = pickClusterRow(profiles, clusterName);
    if (!row) return;
    buildChart(canvasId, row, features, clusterName, "radar");
    const insightEl = document.getElementById(insightId);
    if (insightEl) insightEl.textContent = `Insight: ${insights[clusterName] || ""}`;
  });

  const keyToCanvas = {
    anxious: ["chart-anxious", "Anxious Avoider"],
    distracted: ["chart-distracted", "Distracted Scroller"],
    selective: ["chart-selective", "Selective Procrastinator"],
    thrill: ["chart-thrill", "Thrill Seeker"],
    tired: ["chart-tired", "Tired One"],
  };

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    if (btn.dataset.mode === "radar") btn.classList.add("active");
    btn.addEventListener("click", () => {
      const key = btn.dataset.target;
      const mode = btn.dataset.mode;
      const pair = keyToCanvas[key];
      if (!pair) return;
      const [canvasId, clusterName] = pair;
      const row = pickClusterRow(profiles, clusterName);
      if (!row) return;

      document.querySelectorAll(`.mode-btn[data-target="${key}"]`).forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      buildChart(canvasId, row, features, clusterName, mode);
    });
  });
}

renderSlide();
loadAndBuildClusterCharts().catch((err) => {
  console.error("Failed to load charts data:", err);
});
