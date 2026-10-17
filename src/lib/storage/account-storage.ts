import {
  ResearchProject,
  AcademicPaper,
  DocumentPage,
  DocumentChunk,
  ChatMessage,
  ResearchNote,
} from "@/types";
import { cleanChunkForDisplay } from "@/lib/ai/gemini";

export interface RegisteredAccount {
  id: string;
  email: string;
  password: string;
  full_name: string;
  institution: string;
  research_field: string;
  created_at: string;
}

export interface ActiveSessionUser {
  id: string;
  email: string;
  full_name: string;
  institution: string;
  research_field: string;
  created_at: string;
}

export interface UserWorkspaceBundle {
  projects: ResearchProject[];
  papers: AcademicPaper[];
  pages: DocumentPage[];
  chunks: DocumentChunk[];
  chatsByProject: Record<string, ChatMessage[]>;
  notes: ResearchNote[];
}

const ACCOUNTS_KEY = "sourcewise_registered_accounts_v1";
const ACTIVE_USER_KEY = "sourcewise_active_user_v1";
const DEMO_SESSION_FLAG = "sourcewise_demo_tab_active_v1";
const DEMO_STORAGE_KEY = "sourcewise_demo_bundle_v1";

const IDB_NAME = "sourcewise_persistent_db_v1";
const IDB_VERSION = 1;
const IDB_STORE_BUNDLES = "workspace_bundles";

/**
 * Cleans leading/trailing pipe symbols or stray brackets from extracted paper titles and author names.
 */
export function sanitizePaperMetadata(paper: AcademicPaper): AcademicPaper {
  const cleanTitle = (paper.title || "Uploaded Study Document")
    .replace(/^[|¦\s•\-–—]+/, "")
    .replace(/[|¦\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  const cleanAuthors = (paper.authors || ["Document Author"]).map((a) =>
    a
      .replace(/^[|¦(\s]+/, "")
      .replace(/[|¦)\s]+$/, "")
      .trim() || "Document Author"
  );

  return {
    ...paper,
    title: cleanTitle || "Uploaded Study Document",
    authors: cleanAuthors,
  };
}

/**
 * Deduplicates papers by normalized title + page_count within the same project.
 */
export function deduplicatePapers(papers: AcademicPaper[]): AcademicPaper[] {
  const seen = new Set<string>();
  const result: AcademicPaper[] = [];
  for (const rawP of papers) {
    const p = sanitizePaperMetadata(rawP);
    const key = `${p.project_id}::${p.title.toLowerCase()}::${p.page_count}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }
  return result;
}

/**
 * Deduplicates projects by id and normalized title.
 */
export function deduplicateProjects(projects: ResearchProject[]): ResearchProject[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: ResearchProject[] = [];
  for (const p of projects) {
    const normTitle = p.title.trim().toLowerCase();
    if (!seenIds.has(p.id) && !seenTitles.has(normTitle)) {
      seenIds.add(p.id);
      seenTitles.add(normTitle);
      result.push(p);
    }
  }
  return result;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_BUNDLES)) {
          db.createObjectStore(IDB_STORE_BUNDLES);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGetBundle(key: string): Promise<UserWorkspaceBundle | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_BUNDLES, "readonly");
      const store = tx.objectStore(IDB_STORE_BUNDLES);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as UserWorkspaceBundle) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSetBundle(key: string, bundle: UserWorkspaceBundle): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_BUNDLES, "readwrite");
      const store = tx.objectStore(IDB_STORE_BUNDLES);
      store.put(bundle, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDeleteBundle(key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_BUNDLES, "readwrite");
      const store = tx.objectStore(IDB_STORE_BUNDLES);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore quota error
  }
}

/**
 * Returns the currently logged-in user, or null if the visitor is in Guest / Demo Mode.
 */
export function getActiveSessionUser(): ActiveSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSessionUser;
  } catch {
    return null;
  }
}

export function setActiveSessionUser(user: ActiveSessionUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event("sourcewise-auth-changed"));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
      window.dispatchEvent(new Event("sourcewise-auth-changed"));
    }
  } catch {
    // ignore
  }
}

function createEmptyBundle(): UserWorkspaceBundle {
  return {
    projects: [],
    papers: [],
    pages: [],
    chunks: [],
    chatsByProject: {},
    notes: [],
  };
}

function sanitizeBundle(bundle: Partial<UserWorkspaceBundle> | null): UserWorkspaceBundle {
  if (!bundle) return createEmptyBundle();
  const cleanProjects = deduplicateProjects(bundle.projects || []);
  const cleanPapers = deduplicatePapers(bundle.papers || []);
  const validPaperIds = new Set(cleanPapers.map((p) => p.id));

  const cleanPages = (bundle.pages || [])
    .filter((pg) => validPaperIds.has(pg.document_id))
    .map((pg) => ({
      ...pg,
      text_content: cleanChunkForDisplay(pg.text_content) || pg.text_content,
    }));

  const cleanChunks = (bundle.chunks || [])
    .filter((chk) => validPaperIds.has(chk.document_id))
    .map((chk) => ({
      ...chk,
      content: cleanChunkForDisplay(chk.content) || chk.content,
    }));

  return {
    projects: cleanProjects,
    papers: cleanPapers,
    pages: cleanPages,
    chunks: cleanChunks,
    chatsByProject: bundle.chatsByProject || {},
    notes: bundle.notes || [],
  };
}

/**
 * Loads the current workspace bundle:
 * - If logged in: loads permanently from IndexedDB (`user::<email>`) with ALL page images 1..N preserved!
 * - If in Demo Mode: loads from the current tab's session (`demo_session`). If the tab was closed and reopened without logging in, Demo Mode starts fresh!
 */
export async function loadWorkspaceBundle(): Promise<UserWorkspaceBundle> {
  if (typeof window === "undefined") return createEmptyBundle();

  // Clear legacy un-scoped localStorage keys so old test duplicates don't pollute Demo Mode
  try {
    localStorage.removeItem("sourcewise_custom_projects");
    localStorage.removeItem("sourcewise_custom_papers");
    localStorage.removeItem("sourcewise_custom_pages");
    localStorage.removeItem("sourcewise_custom_chunks");
  } catch {
    // ignore
  }

  const user = getActiveSessionUser();

  if (user) {
    const accountKey = `user::${user.email.toLowerCase()}`;
    const idbBundle = await idbGetBundle(accountKey);
    if (idbBundle) {
      return sanitizeBundle(idbBundle);
    }
    try {
      const fallbackRaw = localStorage.getItem(`sourcewise_fallback_${accountKey}`);
      if (fallbackRaw) {
        return sanitizeBundle(JSON.parse(fallbackRaw));
      }
    } catch {
      // ignore
    }
    return createEmptyBundle();
  }

  // DEMO MODE: Only persists while the current browser tab/session is open.
  // Closing the tab or browser resets Demo Mode unless the user signs up / logs in!
  const isTabSessionActive = sessionStorage.getItem(DEMO_SESSION_FLAG) === "1";
  if (!isTabSessionActive) {
    sessionStorage.setItem(DEMO_SESSION_FLAG, "1");
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    await idbDeleteBundle("demo::temp");
    return createEmptyBundle();
  }

  const demoIdbBundle = await idbGetBundle("demo::temp");
  if (demoIdbBundle) {
    return sanitizeBundle(demoIdbBundle);
  }

  try {
    const rawDemo = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (rawDemo) {
      return sanitizeBundle(JSON.parse(rawDemo));
    }
  } catch {
    // ignore
  }

  return createEmptyBundle();
}

/**
 * Saves the workspace bundle (including ALL page `image_url` renders for Pages 1..N in IndexedDB).
 */
export async function saveWorkspaceBundle(bundle: UserWorkspaceBundle): Promise<void> {
  if (typeof window === "undefined") return;
  const cleaned = sanitizeBundle(bundle);
  const user = getActiveSessionUser();

  if (user) {
    const accountKey = `user::${user.email.toLowerCase()}`;
    // Store full bundle (including all page images 1..N) in IndexedDB
    await idbSetBundle(accountKey, cleaned);
    // Also store lightweight text-only backup in localStorage
    try {
      const lightweight: UserWorkspaceBundle = {
        ...cleaned,
        pages: cleaned.pages.map((pg) => ({ ...pg, image_url: undefined })),
      };
      localStorage.setItem(`sourcewise_fallback_${accountKey}`, JSON.stringify(lightweight));
    } catch {
      // ignore localStorage quota error
    }
    return;
  }

  // DEMO MODE: store full bundle (with all page images 1..N) in IndexedDB "demo::temp" for current session
  sessionStorage.setItem(DEMO_SESSION_FLAG, "1");
  await idbSetBundle("demo::temp", cleaned);
  try {
    const lightweight: UserWorkspaceBundle = {
      ...cleaned,
      pages: cleaned.pages.map((pg) => ({ ...pg, image_url: undefined })),
    };
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(lightweight));
  } catch {
    // ignore
  }
}

/**
 * Registers a new user account, logs them in immediately, and migrates any work done in Demo Mode into their permanent account!
 */
export async function registerUserAccount(params: {
  email: string;
  password: string;
  full_name: string;
  institution?: string;
  research_field?: string;
}): Promise<{ user: ActiveSessionUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { user: null as unknown as ActiveSessionUser, error: "Please enter a valid email address." };
  }
  if (!params.password || params.password.length < 4) {
    return {
      user: null as unknown as ActiveSessionUser,
      error: "Password must be at least 4 characters.",
    };
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      user: null as unknown as ActiveSessionUser,
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  // Capture any current Demo Mode work BEFORE switching to the new user so we can migrate it!
  const currentDemoBundle = await idbGetBundle("demo::temp");

  const newAccount: RegisteredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    password: params.password,
    full_name: params.full_name.trim() || cleanEmail.split("@")[0],
    institution: (params.institution || "").trim() || "Independent Researcher",
    research_field: (params.research_field || "").trim() || "General Study & Research",
    created_at: new Date().toISOString(),
  };

  saveRegisteredAccounts([...accounts, newAccount]);

  const sessionUser: ActiveSessionUser = {
    id: newAccount.id,
    email: newAccount.email,
    full_name: newAccount.full_name,
    institution: newAccount.institution,
    research_field: newAccount.research_field,
    created_at: newAccount.created_at,
  };

  setActiveSessionUser(sessionUser);

  // Migrate any Demo Mode uploads/projects into the newly created permanent account!
  if (
    currentDemoBundle &&
    (currentDemoBundle.papers.length > 0 ||
      currentDemoBundle.projects.length > 0 ||
      currentDemoBundle.notes.length > 0)
  ) {
    await saveWorkspaceBundle(currentDemoBundle);
    await idbDeleteBundle("demo::temp");
  }

  return { user: sessionUser };
}

/**
 * Authenticates an existing user account and restores their permanent workspace.
 */
export async function loginUserAccount(params: {
  email: string;
  password: string;
}): Promise<{ user: ActiveSessionUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    // If they used the pre-filled default scholar account for the first time, auto-register it as a permanent account
    if (cleanEmail === "student@university.edu" && params.password === "academic-research") {
      return registerUserAccount({
        email: cleanEmail,
        password: params.password,
        full_name: "Demo Scholar Account",
        institution: "University Study Desk",
        research_field: "Interdisciplinary Research",
      });
    }
    return {
      user: null as unknown as ActiveSessionUser,
      error: "Account not found. Please create a new account first!",
    };
  }

  if (found.password !== params.password) {
    return {
      user: null as unknown as ActiveSessionUser,
      error: "Incorrect password. Please try again.",
    };
  }

  // Capture any unsaved Demo Mode uploads and merge them into the user's permanent account on login
  const currentDemoBundle = await idbGetBundle("demo::temp");

  const sessionUser: ActiveSessionUser = {
    id: found.id,
    email: found.email,
    full_name: found.full_name,
    institution: found.institution,
    research_field: found.research_field,
    created_at: found.created_at,
  };

  setActiveSessionUser(sessionUser);

  if (
    currentDemoBundle &&
    (currentDemoBundle.papers.length > 0 || currentDemoBundle.projects.length > 0)
  ) {
    const existingUserBundle = await loadWorkspaceBundle();
    const mergedBundle: UserWorkspaceBundle = {
      projects: deduplicateProjects([
        ...currentDemoBundle.projects,
        ...existingUserBundle.projects,
      ]),
      papers: deduplicatePapers([...currentDemoBundle.papers, ...existingUserBundle.papers]),
      pages: [...currentDemoBundle.pages, ...existingUserBundle.pages],
      chunks: [...currentDemoBundle.chunks, ...existingUserBundle.chunks],
      chatsByProject: {
        ...existingUserBundle.chatsByProject,
        ...currentDemoBundle.chatsByProject,
      },
      notes: [...currentDemoBundle.notes, ...existingUserBundle.notes],
    };
    await saveWorkspaceBundle(mergedBundle);
    await idbDeleteBundle("demo::temp");
  }

  return { user: sessionUser };
}

/**
 * Logs out the current user and clears temporary Demo Mode data.
 */
export async function logoutUserAccount(): Promise<void> {
  setActiveSessionUser(null);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    await idbDeleteBundle("demo::temp");
  }
}
