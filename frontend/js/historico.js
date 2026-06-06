'use strict';

const API_BASE_URL = 'http://localhost:3000/api';

// ─── ESTADO ──────────────────────────────────────────────────────────────────
let tokenGlobal = null;

const state = {
  upcoming: [],
  history:  [],
  cancelId: null,
};

// ─── SVGs ────────────────────────────────────────────────────────────────────
const SVG = {
  calendar: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 1.5V4.5" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 1.5V4.5" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.25 7.5H15.75" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  clock: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 4.5V9L11.25 11.25" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
};

document.addEventListener('DOMContentLoaded', () => {
  // Lógica do menu mobile
  const navToggle = document.getElementById('navbar-toggle');
  const navMenu = document.getElementById('navbar-nav');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }
});