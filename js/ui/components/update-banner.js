/** Shows the "new version available" bar. `onAccept` activates the update and reloads. */
export function showUpdateBanner(onAccept) {
  if (document.querySelector('.update-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = 'Nova versão disponível';

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Recarregar';
  button.addEventListener('click', () => {
    button.disabled = true;
    onAccept();
  });

  banner.append(text, button);
  document.body.append(banner);
}
