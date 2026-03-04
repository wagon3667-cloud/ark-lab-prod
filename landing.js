const config = window.ARK_CONFIG || {};

function setupReveal() {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  revealNodes.forEach((node) => node.classList.add("reveal-ready"));

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealNodes.forEach((node) => observer.observe(node));

  window.setTimeout(() => {
    revealNodes.forEach((node) => {
      if (!node.classList.contains("is-visible")) {
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          node.classList.add("is-visible");
        }
      }
    });
  }, 160);
}

function bindLinks() {
  const miniAppLink = config.miniAppPath || "./mini-app/";
  document.querySelectorAll("[data-mini-app-link]").forEach((link) => {
    link.setAttribute("href", miniAppLink);
  });

  const hintNode = document.getElementById("contactHint");
  if (hintNode && config.contactHint) {
    hintNode.textContent = config.contactHint;
  }
}

async function copyContact() {
  const parts = [];
  if (config.contactHandle && String(config.contactHandle).startsWith("@")) {
    parts.push(String(config.contactHandle));
  }
  if (config.contactHint) {
    parts.push(config.contactHint);
  }
  const contactText = parts.join("\n").trim();
  if (!contactText) return;

  try {
    await navigator.clipboard.writeText(contactText);
    document.querySelectorAll("[data-copy-contact]").forEach((button) => {
      const original = button.textContent;
      button.textContent = "Скопировано";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1400);
    });
  } catch (error) {
    window.alert(contactText);
  }
}

function bindCopyButtons() {
  document.querySelectorAll("[data-copy-contact]").forEach((button) => {
    button.addEventListener("click", copyContact);
  });
}

setupReveal();
bindLinks();
bindCopyButtons();
