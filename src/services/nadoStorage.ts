import { EventProject, Booking, UserProfile } from '../types';
import { calculateProjectProgress } from '../utils/projectProgress';
import { getStorageNamespace } from './storageNamespace';

const SCHEMA_VERSION = 'nado_prazdnik_v2';

function getKey(base: string): string {
  const ns = getStorageNamespace();
  if (ns === 'nado_prazdnik_demo') {
    if (base === 'profile_cache') return 'nado_prazdnik_demo_profile';
    return `nado_prazdnik_demo_${base}`;
  } else {
    if (base === 'profile_cache') return 'nado_prazdnik_profile_cache';
    return `nado_prazdnik_${base}`;
  }
}

export function generateStableId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `event-${Date.now()}-${randomStr}`;
}

export function safeParseJson<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.error('Failed to parse JSON', e);
    return fallback;
  }
}

export function isValidEventProject(p: any): p is EventProject {
  return (
    p &&
    typeof p === 'object' &&
    typeof p.id === 'string' &&
    typeof p.name === 'string'
  );
}

export function getProfile(): UserProfile {
  runMigrationIfNeeded();
  try {
    const saved = localStorage.getItem(getKey('profile_cache'));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse profile cache', e);
  }
  return { name: '', phone: '', email: '', isFilled: false };
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(getKey('profile_cache'), JSON.stringify(profile));
}

export function migrateStorageSchema() {
  const version = localStorage.getItem('nado_prazdnik_schema_version');
  if (version === SCHEMA_VERSION) {
    return;
  }

  const oldActiveId = localStorage.getItem('nado_holiday_active_project_id') || localStorage.getItem('evently_active_project_id');
  if (oldActiveId && !localStorage.getItem('nado_prazdnik_active_project_id')) {
    localStorage.setItem('nado_prazdnik_active_project_id', oldActiveId);
  }

  const oldProfile = localStorage.getItem('nado_holiday_profile') || localStorage.getItem('evently_profile');
  if (oldProfile && !localStorage.getItem('nado_prazdnik_profile_cache')) {
    localStorage.setItem('nado_prazdnik_profile_cache', oldProfile);
  }

  const oldBookings = localStorage.getItem('nado_holiday_bookings') || localStorage.getItem('evently_bookings');
  if (oldBookings && !localStorage.getItem('nado_prazdnik_bookings')) {
    localStorage.setItem('nado_prazdnik_bookings', oldBookings);
  }

  const oldFavorites = localStorage.getItem('nado_holiday_favorites') || localStorage.getItem('evently_favorites');
  if (oldFavorites && !localStorage.getItem('nado_prazdnik_favorites')) {
    localStorage.setItem('nado_prazdnik_favorites', oldFavorites);
  }

  const oldProjects = localStorage.getItem('nado_holiday_projects') || localStorage.getItem('evently_projects');
  if (oldProjects && !localStorage.getItem('nado_prazdnik_projects')) {
    const parsedOld = safeParseJson<any[]>(oldProjects, []);
    const validated = parsedOld.filter(isValidEventProject);
    localStorage.setItem('nado_prazdnik_projects', JSON.stringify(validated));
  }

  const oldTheme = localStorage.getItem('nado_holiday_theme') || localStorage.getItem('evently_theme');
  if (oldTheme && !localStorage.getItem('nado_prazdnik_theme')) {
    localStorage.setItem('nado_prazdnik_theme', oldTheme);
  }

  localStorage.setItem('nado_prazdnik_schema_version', SCHEMA_VERSION);
}

export function getProjects(): EventProject[] {
  runMigrationIfNeeded();
  try {
    const saved = localStorage.getItem(getKey('projects'));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse projects from storage', e);
  }
  return [];
}

export function getProjectById(id: string | undefined): EventProject | null {
  if (!id) return null;
  const projects = getProjects();
  const found = projects.find((p) => p.id === id);
  return found || null;
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(getKey('active_project_id'));
}

export function setActiveProjectId(id: string | null) {
  if (id) {
    localStorage.setItem(getKey('active_project_id'), id);
  } else {
    localStorage.removeItem(getKey('active_project_id'));
  }
}

export function getActiveProject(): EventProject | null {
  const projects = getProjects();
  const activeId = getActiveProjectId();
  if (activeId) {
    const proj = projects.find((p) => p.id === activeId);
    if (proj) return proj;
  }
  return projects[0] || null;
}

export function saveProject(project: EventProject): { success: boolean; project?: EventProject; error?: string } {
  try {
    const projects = getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    
    project.progressPercent = calculateProjectProgress(project.planItems || []);
    project.updatedAt = new Date().toISOString();

    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(getKey('projects'), JSON.stringify(projects));
    
    if (getActiveProjectId() === project.id || !getActiveProjectId()) {
      setActiveProjectId(project.id);
    }

    const verified = getProjectById(project.id);
    if (verified) {
      return { success: true, project: verified };
    } else {
      return { success: false, error: 'Не удалось прочитать сохранённое мероприятие из хранилища NADO' };
    }
  } catch (e: any) {
    console.error('Failed to save project', e);
    return { success: false, error: e?.message || 'Ошибка записи в localStorage' };
  }
}

export function deleteProject(id: string) {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  localStorage.setItem(getKey('projects'), JSON.stringify(filtered));
  
  if (getActiveProjectId() === id) {
    if (filtered.length > 0) {
      setActiveProjectId(filtered[0].id);
    } else {
      setActiveProjectId(null);
    }
  }
}

export function getBookings(): Booking[] {
  try {
    const saved = localStorage.getItem(getKey('bookings'));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse bookings from storage', e);
  }
  return [];
}

export function saveBookings(bookings: Booking[]) {
  localStorage.setItem(getKey('bookings'), JSON.stringify(bookings));
}

export function addBooking(booking: Booking) {
  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);

  const activeProject = getActiveProject();
  if (activeProject) {
    activeProject.bookings = activeProject.bookings || [];
    activeProject.bookings.push(booking);
    
    const category = booking.selectedService.toLowerCase().includes('dj') ? 'dj' : 'venue'; 
    const planItem = activeProject.planItems?.find(p => p.category === category);
    if (planItem) {
      planItem.status = 'request_sent';
      planItem.bookingId = booking.id;
    }
    saveProject(activeProject);
  }
}

export function getFavorites(): string[] {
  try {
    const saved = localStorage.getItem(getKey('favorites'));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse favorites from storage', e);
  }
  return [];
}

export function toggleFavorite(contractorId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(contractorId);
  let isFav = false;
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(contractorId);
    isFav = true;
  }
  localStorage.setItem(getKey('favorites'), JSON.stringify(favorites));
  return isFav;
}

function runMigrationIfNeeded() {
  if (getStorageNamespace() === 'nado_prazdnik_demo') return;
  migrateStorageSchema();
}
