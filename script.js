document.addEventListener("DOMContentLoaded", function () {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwB6uBCca3eOkWixBr4fnjz7the6_HaJqv6hc1Nf7laXfqI3kd7ljUlVDv18elTmSyMFQ/exec";

  const navbar = document.getElementById("navbar");
  const menuButton = document.getElementById("menuButton");
  const navLinks = document.getElementById("navLinks");
  const mouseGlow = document.getElementById("mouseGlow");

  window.addEventListener("scroll", function () {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  menuButton.addEventListener("click", function () {
    navLinks.classList.toggle("active");

    if (navLinks.classList.contains("active")) {
      menuButton.textContent = "✕";
    } else {
      menuButton.textContent = "☰";
    }
  });

  document.querySelectorAll("#navLinks a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("active");
      menuButton.textContent = "☰";
    });
  });

  window.addEventListener("mousemove", function (event) {
    mouseGlow.style.left = event.clientX + "px";
    mouseGlow.style.top = event.clientY + "px";
  });

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  document.querySelectorAll(".reveal").forEach(function (element) {
    revealObserver.observe(element);
  });

  const qualityProgress = document.querySelector(".quality-progress i");

  setTimeout(function () {
    if (qualityProgress) {
      qualityProgress.style.width = "98.4%";
    }
  }, 700);

  const durationButtons = document.querySelectorAll(
    ".duration-buttons button"
  );

  const durationSelect = document.getElementById("durationSelect");

  function selectDuration(duration) {
    durationButtons.forEach(function (button) {
      button.classList.toggle(
        "active",
        button.dataset.duration === duration
      );
    });

    durationSelect.value = duration;
    updateFormProgress();
  }

  durationButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectDuration(button.dataset.duration);

      document.getElementById("apply").scrollIntoView({
        behavior: "smooth"
      });
    });
  });

  durationSelect.addEventListener("change", function () {
    durationButtons.forEach(function (button) {
      button.classList.toggle(
        "active",
        button.dataset.duration === durationSelect.value
      );
    });

    updateFormProgress();
  });

  const programLinks = document.querySelectorAll("[data-program]");

  programLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      const selectedProgram = link.dataset.program;

      setTimeout(function () {
        document.getElementById("program").value = selectedProgram;
        updateFormProgress();
      }, 400);
    });
  });

  const form = document.getElementById("applicationForm");
  const submitButton = document.getElementById("submitButton");
  const formMessage = document.getElementById("formMessage");
  const formProgress = document.getElementById("formProgress");

  const requiredFields = form.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );

  function updateFormProgress() {
    let completedFields = 0;

    requiredFields.forEach(function (field) {
      if (field.value.trim() !== "") {
        completedFields++;
      }
    });

    const percentage =
      (completedFields / requiredFields.length) * 100;

    formProgress.style.width = percentage + "%";
  }

  requiredFields.forEach(function (field) {
    field.addEventListener("input", updateFormProgress);
    field.addEventListener("change", updateFormProgress);
  });

  function showMessage(message, type) {
    formMessage.innerHTML = message;
    formMessage.className = "form-message " + type;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("loading", isLoading);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (submitButton.disabled) {
      return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const country = document.getElementById("country").value.trim();
    const program = document.getElementById("program").value;
    const duration = document.getElementById("durationSelect").value;
    const message = document.getElementById("message").value.trim();

    if (
      !name ||
      !email ||
      !phone ||
      !country ||
      !program ||
      !duration ||
      !message
    ) {
      showMessage(
        "⚠ Please complete all required fields.",
        "error"
      );

      return;
    }

    if (!validateEmail(email)) {
      showMessage(
        "⚠ Please enter a valid email address.",
        "error"
      );

      document.getElementById("email").focus();

      return;
    }

    setLoading(true);

    showMessage(
      "Sending your application...",
      "success"
    );

    const formData = new URLSearchParams();

    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("country", country);
    formData.append("program", program);
    formData.append("duration", duration);
    formData.append("message", message);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      showMessage(
        "✓ <strong>Application submitted successfully.</strong><br>Our team will contact you after reviewing your application.",
        "success"
      );

      form.reset();

      durationButtons.forEach(function (button) {
        button.classList.remove("active");
      });

      updateFormProgress();

      setTimeout(function () {
        setLoading(false);
      }, 700);
    } catch (error) {
      console.error(error);

      showMessage(
        "✕ Submission failed. Please check your internet connection and try again.",
        "error"
      );

      setLoading(false);
    }
  });

  form.addEventListener("keydown", function (event) {
    if (
      event.key === "Enter" &&
      event.target.tagName !== "TEXTAREA" &&
      event.target.tagName !== "BUTTON"
    ) {
      event.preventDefault();
    }
  });
});