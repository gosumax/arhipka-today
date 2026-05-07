(() => {
  const mobileMenus = [...document.querySelectorAll(".mobile-menu")].filter(
    (node) => node instanceof HTMLDetailsElement
  );

  if (mobileMenus.length) {
    const closeOtherMenus = (currentMenu) => {
      mobileMenus.forEach((menu) => {
        if (menu !== currentMenu) menu.open = false;
      });
    };

    mobileMenus.forEach((menu) => {
      menu.addEventListener("toggle", () => {
        if (menu.open) closeOtherMenus(menu);
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      mobileMenus.forEach((menu) => {
        if (menu.open && !menu.contains(target)) {
          menu.open = false;
        }
      });
    });
  }

  const videos = document.querySelectorAll(".hero-video[data-src]");
  if (!videos.length) return;

  const canAutoplayVideo =
    window.matchMedia("(min-width: 761px)").matches;

  videos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement)) return;

    if (!canAutoplayVideo) {
      video.preload = "none";
      video.removeAttribute("autoplay");
      return;
    }

    if (!video.getAttribute("src")) {
      video.setAttribute("src", video.dataset.src || "");
    }
    video.preload = "metadata";
    video.play().catch(() => {});
  });

  const lazyPhotos = [...document.querySelectorAll(".card-photo-lazy")];
  if (!lazyPhotos.length) return;

  const revealPhoto = (node) => {
    node.classList.remove("card-photo-lazy");
  };

  if (!("IntersectionObserver" in window)) {
    lazyPhotos.forEach(revealPhoto);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealPhoto(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "240px 0px" }
  );

  lazyPhotos.forEach((node) => observer.observe(node));
})();
