// Migration script: Convert all entry.date fields in localStorage to 'YYYY-MM-DD' (local midnight)
(function migratePontajEntriesToLocalDate() {
  const keyPrefix = 'calendar_';
  let changed = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(keyPrefix)) {
      const calendar = JSON.parse(localStorage.getItem(key));
      if (calendar && Array.isArray(calendar.entries)) {
        let updated = false;
        calendar.entries.forEach(entry => {
          if (typeof entry.date === 'string' && entry.date.length > 10) {
            // Convert ISO/UTC string to local date string
            const d = new Date(entry.date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const localDateString = `${year}-${month}-${day}`;
            entry.date = localDateString;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(key, JSON.stringify(calendar));
          changed = true;
        }
      }
    }
  }
  if (changed) {
    alert('Migration complete: All entry.date fields are now local midnight (YYYY-MM-DD).');
  } else {
    alert('No migration needed: All entry.date fields already local.');
  }
})();
