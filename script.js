```javascript
// ===============================
// MOBILE MENU
// ===============================

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

if (menuBtn && navMenu) {

  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  document.querySelectorAll("nav a").forEach(link => {

    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });

  });

}


// ===============================
// DURATION BUTTONS
// ===============================

const durationButtons =
  document.querySelectorAll(".duration-buttons button");

const durationSelect =
  document.getElementById("durationSelect");

durationButtons.forEach(button => {

  button.addEventListener("click", () => {

    durationButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    durationSelect.value =
      button.dataset.duration;

    document.getElementById("apply")
      .scrollIntoView({
        behavior: "smooth"
      });

  });

});


// ===============================
// GOOGLE SHEETS CONNECTION
// ===============================

const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbwB6uBCca3eOkWixBr4fnjz7the6_HaJqv6hc1Nf7laXfqI3kd7ljUlVDv18elTmSyMFQ/exec";


// ===============================
// APPLICATION FORM
// ===============================

const form =
  document.getElementById("applicationForm");

const formMessage =
  document.getElementById("formMessage");


form.addEventListener("submit", async (event) => {

  event.preventDefault();


  // Get submit button

  const submitButton =
    form.querySelector("button[type='submit']");


  // Get form values

  const name =
    document.getElementById("name").value.trim();

  const email =
    document.getElementById("email").value.trim();

  const phone =
    document.getElementById("phone").value.trim();

  const country =
    document.getElementById("country").value.trim();

  const program =
    document.getElementById("program").value;

  const duration =
    document.getElementById("durationSelect").value;

  const message =
    document.getElementById("message").value.trim();


  // Disable submit button

  submitButton.disabled = true;

  submitButton.textContent =
    "Submitting...";

  formMessage.textContent = "";


  // Prepare data

  const formData =
    new URLSearchParams();

  formData.append(
    "name",
    name
  );

  formData.append(
    "email",
    email
  );

  formData.append(
    "phone",
    phone
  );

  formData.append(
    "country",
    country
  );

  formData.append(
    "program",
    program
  );

  formData.append(
    "duration",
    duration
  );

  formData.append(
    "message",
    message
  );


  try {


    // Send application to Google Sheets

    await fetch(
      GOOGLE_SCRIPT_URL,
      {
        method: "POST",

        mode: "no-cors",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body:
          formData.toString()
      }
    );


    // Show success message

    formMessage.textContent =
      `Thank you, ${name}! Your application has been submitted successfully.`;

    formMessage.style.color =
      "#1683ff";


    // Clear form

    form.reset();


    // Remove duration selection

    durationButtons.forEach(btn => {

      btn.classList.remove("active");

    });


  } catch (error) {


    console.error(
      "Application Error:",
      error
    );


    formMessage.textContent =
      "Something went wrong. Please try again.";

    formMessage.style.color =
      "red";

  }


  // Enable button again

  submitButton.disabled = false;

  submitButton.textContent =
    "Submit Application →";

});
```
