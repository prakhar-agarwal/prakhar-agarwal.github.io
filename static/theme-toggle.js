(function() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  }

  toggleBtn.addEventListener('click', function() {
    document.documentElement.classList.toggle('dark-theme');
    
    let theme = 'light';
    if (document.documentElement.classList.contains('dark-theme')) {
      theme = 'dark';
    }
    
    localStorage.setItem('theme', theme);
  });
})();
