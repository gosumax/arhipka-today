(() => {
  const rotators = document.querySelectorAll("[data-hero-rotator]");
  if (!rotators.length) return;

  const canUseMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canUseVideo = window.matchMedia("(min-width: 760px)").matches && canUseMotion;

  const loadVideo = (video) => {
    if (!video || video.dataset.loaded === "true" || !canUseVideo) return;
    const source = video.dataset.src;
    if (!source) return;
    const sourceNode = document.createElement("source");
    sourceNode.src = source;
    sourceNode.type = "video/mp4";
    video.append(sourceNode);
    video.dataset.loaded = "true";
    video.load();
  };

  const activateSlide = (slides, index) => {
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === index;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      if (slide.tagName === "VIDEO") {
        if (isActive) {
          loadVideo(slide);
          slide.play?.().catch(() => {});
        } else {
          slide.pause?.();
        }
      }
    });
  };

  rotators.forEach((rotator) => {
    const slides = [...rotator.querySelectorAll(".hero-slide")];
    if (!slides.length) return;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    if (activeIndex < 0) activeIndex = 0;
    activateSlide(slides, activeIndex);

    if (!canUseMotion || slides.length < 2) return;

    window.setInterval(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      activateSlide(slides, activeIndex);
    }, 3000);
  });
})();
