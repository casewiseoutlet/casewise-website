document.addEventListener("DOMContentLoaded", function () {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwB6uBCca3eOkWixBr4fnjz7the6_HaJqv6hc1Nf7laXfqI3kd7ljUlVDv18elTmSyMFQ/exec";

  const form = document.getElementById("verifyForm");
  const button = document.getElementById("verifyButton");
  const notice = document.getElementById("formNotice");
  const resultCard = document.getElementById("resultCard");
  const verifyAnother = document.getElementById("verifyAnother");

  const fields = {
    name: document.getElementById("resultName"),
    id: document.getElementById("resultId"),
    program: document.getElementById("resultProgram"),
    duration: document.getElementById("resultDuration"),
    status: document.getElementById("resultStatus"),
    issueDate: document.getElementById("resultIssueDate"),
    completionDate: document.getElementById("resultCompletionDate")
  };

  function normalize(value) {
    return String(value || "").trim();
  }

  function pick(object, keys, fallback) {
    for (const key of keys) {
      if (object && object[key] !== undefined && object[key] !== null && object[key] !== "") {
        return object[key];
      }
    }
    return fallback || "—";
  }

  function setLoading(isLoading) {
    button.disabled = isLoading;
    button.classList.toggle("loading", isLoading);
    button.querySelector(".button-text").textContent =
      isLoading ? "Checking Record..." : "Verify Letter";
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.className = "notice error";
  }

  function clearNotice() {
    notice.textContent = "";
    notice.className = "notice";
  }

  function showInvalid(message) {
    form.hidden = true;
    resultCard.hidden = false;
    resultCard.classList.add("invalid");
    document.getElementById("resultIcon").textContent = "×";
    document.getElementById("resultLabel").textContent = "RECORD NOT VERIFIED";
    document.getElementById("resultTitle").textContent = "Letter Not Found";
    document.getElementById("resultDescription").textContent =
      message || "The Internship ID or Verification Code is invalid.";
  }

  function showVerified(record, enteredId) {
    form.hidden = true;
    resultCard.hidden = false;
    resultCard.classList.remove("invalid");

    document.getElementById("resultIcon").textContent = "✓";
    document.getElementById("resultLabel").textContent = "VERIFIED RECORD";
    document.getElementById("resultTitle").textContent = "Internship Letter Verified";
    document.getElementById("resultDescription").textContent =
      "This record was found in the official Casewise Outlet LTD database.";

    fields.name.textContent = pick(record, ["name", "Name", "candidateName", "fullName"]);
    fields.id.textContent = pick(
      record,
      ["internshipId", "internshipID", "Internship ID", "id"],
      enteredId
    );
    fields.program.textContent = pick(record, ["program", "Program", "internshipProgram"]);
    fields.duration.textContent = pick(record, ["duration", "Duration"]);
    fields.status.textContent = pick(record, ["status", "Status"], "Verified");
    fields.issueDate.textContent = pick(record, ["issueDate", "Issue Date", "issuedAt"]);
    fields.completionDate.textContent = pick(
      record,
      ["completionDate", "Completion Date", "completedAt"],
      "—"
    );
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearNotice();

    const internshipId = normalize(document.getElementById("internshipId").value).toUpperCase();
    const verificationCode = normalize(
      document.getElementById("verificationCode").value
    ).toUpperCase();

    if (!internshipId || !verificationCode) {
      showNotice("Please enter both Internship ID and Verification Code.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        id: internshipId,
        code: verificationCode,
        internshipId: internshipId,
        verificationCode: verificationCode
      });

      const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Verification service returned an error.");
      }

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        const lower = rawText.toLowerCase();
        if (lower.includes("verified") || lower.includes("valid") || lower.includes("success")) {
          data = { success: true, verified: true };
        } else {
          data = { success: false, message: rawText };
        }
      }

      const record = data.record || data.data || data.result || data;
      const isVerified =
        data.verified === true ||
        data.valid === true ||
        data.success === true ||
        String(data.status || "").toLowerCase() === "verified" ||
        String(record.status || "").toLowerCase() === "verified" ||
        Boolean(record.name || record.Name || record["Internship ID"]);

      if (isVerified) {
        showVerified(record, internshipId);
      } else {
        showInvalid(data.message || data.error);
      }
    } catch (error) {
      console.error(error);
      showNotice(
        "Verification service could not be reached. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  });

  verifyAnother.addEventListener("click", function () {
    resultCard.hidden = true;
    resultCard.classList.remove("invalid");
    form.hidden = false;
    form.reset();
    clearNotice();
    document.getElementById("internshipId").focus();
  });

  const query = new URLSearchParams(window.location.search);
  const prefilledId = query.get("id");
  const prefilledCode = query.get("code");

  if (prefilledId) {
    document.getElementById("internshipId").value = prefilledId.toUpperCase();
  }

  if (prefilledCode) {
    document.getElementById("verificationCode").value = prefilledCode.toUpperCase();
  }
});
