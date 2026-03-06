const form = document.getElementById('login-form');
const statusDiv = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusDiv.textContent = 'Enviando...';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const resp = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();

    if (data.ok) {
      statusDiv.innerHTML =
        '<span class="ok">Login correcto</span> — usuario: ' + data.user.email;
    } else {
      statusDiv.innerHTML =
        '<span class="error">' +
        (data.message || 'Error en login') +
        '</span>';
    }
  } catch (err) {
    console.error(err);
    statusDiv.innerHTML =
      '<span class="error">Error de red o servidor</span>';
  }
});

