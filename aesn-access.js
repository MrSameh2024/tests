/* AESN registration and visits. The session is established only after registration is confirmed. */
(function () {
  'use strict';
  const sessionKey = 'ssh_aesn_registration_v1';
  const endpoint = 'https://script.google.com/macros/s/AKfycbwXKby0ftvHXqoNyYouxh4vStgiiCWyZ52CWmexbtyLoDfPSok7HcYDTa41PWIbVXoJ_A/exec';
  const activities = new Map([
    ['games', 'aesn-games.html'],
    ['challenge', 'aesn-challenge.html'],
    ['tests', 'aesn-tests.html']
  ]);
  const isLive = location.protocol === 'https:' &&
    ['mrsameh2024.github.io', 'smartstudentshub.com', 'www.smartstudentshub.com'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('mock') !== '1';

  function get() {
    try {
      const registration = JSON.parse(sessionStorage.getItem(sessionKey));
      if (registration && registration.name && (registration.email || registration.phone) &&
          ['Student', 'Teacher', 'Parent'].includes(registration.role) &&
          ['10', '11', '12'].includes(registration.grade)) return registration;
    } catch {}
    return null;
  }

  function save(registration) {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(registration));
      return true;
    } catch {
      return false;
    }
  }

  function clear() {
    try { sessionStorage.removeItem(sessionKey); } catch {}
  }

  function activityUrl(activity, grade) {
    const path = activities.get(activity);
    if (!path) return '';
    return path + (['10', '12'].includes(grade) ? '?g=' + grade : '');
  }

  function requireActivity(activity) {
    const registration = get();
    if (registration) return registration;
    const grade = new URLSearchParams(location.search).get('g');
    const course = grade === '12' ? 'asen-grade12.html' : 'adsen-grade10.html';
    location.replace(course + '?activity=' + activity +
      (['10', '12'].includes(grade) ? '&g=' + grade : '') + '#registration');
    return null;
  }

  function recordVisit(page, registration) {
    if (!isLive) return;
    const { name, role, email, phone, cls } = registration;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        type: 'use', name, role, email, phone, cls, page,
        ref: location.pathname.split('/').pop()
      }),
      keepalive: true
    }).catch(() => {});
  }

  window.AESN_ACCESS = { get, save, clear, activityUrl, requireActivity, recordVisit, isLive, endpoint };
})();
