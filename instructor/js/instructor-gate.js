(function () {
  "use strict";

  const app = document.getElementById("app");
  const payload = window.N444_ENCRYPTED_DATA;

  function bytesFromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function joinBytes(first, second) {
    const joined = new Uint8Array(first.length + second.length);
    joined.set(first, 0);
    joined.set(second, first.length);
    return joined;
  }

  async function decryptData(password) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: bytesFromBase64(payload.salt),
        iterations: payload.iterations,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const ciphertext = bytesFromBase64(payload.ciphertext);
    const tag = bytesFromBase64(payload.tag);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytesFromBase64(payload.iv),
        tagLength: 128
      },
      key,
      joinBytes(ciphertext, tag)
    );

    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  function loadApp() {
    const script = document.createElement("script");
    script.src = "js/app.js?v=transparent-cover-20260702b";
    script.defer = true;
    document.body.appendChild(script);
  }

  function renderGate(message) {
    app.innerHTML = `
      <main class="screen">
        <section class="cover-page" aria-labelledby="instructor-title">
          <div class="cover-head">
            <div>
              <span class="cover-badge">Instructor version</span>
              <h2 id="instructor-title">N444 Exam 2 Faculty Access</h2>
            </div>
            <div class="cover-professor" aria-hidden="true">
              <img src="assets/generated/coach-point.webp?v=clean-bg-20260702" alt="" />
              <span>Faculty copy. Keep it protected.</span>
            </div>
          </div>
          <div class="cover-copy">
            <div class="professor-bubble">
              <span>Private instructor bank</span>
              <p>This version contains the full instructor study bank. Enter the faculty password to unlock it.</p>
            </div>
            <form class="start-panel" id="instructor-gate-form">
              <label class="filter-card" for="instructor-password">
                <strong>Password</strong><br />
                <input id="instructor-password" type="password" autocomplete="current-password" required />
              </label>
              ${message ? `<p class="count-note">${message}</p>` : ""}
              <button class="primary-btn wide" type="submit">Unlock instructor version</button>
            </form>
          </div>
        </section>
      </main>
    `;

    const form = document.getElementById("instructor-gate-form");
    const input = document.getElementById("instructor-password");
    input.focus();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      button.textContent = "Unlocking...";

      try {
        window.N444_DATA = await decryptData(input.value);
        loadApp();
      } catch (error) {
        renderGate("That password did not unlock the faculty bank. Please try again.");
      }
    });
  }

  if (!payload || !window.crypto || !window.crypto.subtle) {
    app.innerHTML = `
      <main class="screen">
        <section class="cover-page">
          <div class="professor-bubble">
            <span>Browser not supported</span>
            <p>This protected instructor version needs a modern browser with secure encryption support.</p>
          </div>
        </section>
      </main>
    `;
    return;
  }

  renderGate("");
})();
