(function () {
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try {
      window.top.location = window.location.href;
    } catch {}
  }
  var preference;
  try {
    preference = localStorage.getItem('saudemais:v1:theme');
  } catch {
    preference = null;
  }
  var dark =
    preference === 'dark' || (preference !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
