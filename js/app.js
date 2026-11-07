// Ponto de entrada do app.
// Registro do service worker (CARD-003), banco (CARD-002) e roteador (CARD-004) entram aqui.

function iniciar() {
  const raiz = document.getElementById('app');
  raiz.textContent = 'Diário de Rolê';
}

iniciar();
