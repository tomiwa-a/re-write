import { folderService } from "./lib/folders";
import { documentService } from "./lib/documents";
import { db } from "./lib/db";
import { SyncEngine } from "./lib/sync";
import { ConvexClient } from "convex/browser";

// Initialize Convex Client
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
const client = new ConvexClient(convexUrl);
const syncEngine = new SyncEngine(client);

// State
let currentUserId = "user_123";

// UI References
const els = {
  connectionStatus: document.getElementById("connectionStatus")!,
  syncStatus: document.getElementById("syncStatus")!,
  userIdInput: document.getElementById("userIdInput") as HTMLInputElement,
  setUserBtn: document.getElementById("setUserBtn")!,
  
  newFolderName: document.getElementById("newFolderName") as HTMLInputElement,
  newFolderParentSelect: document.getElementById("newFolderParentSelect") as HTMLSelectElement,
  createFolderBtn: document.getElementById("createFolderBtn")!,
  foldersList: document.getElementById("foldersList")!,
  
  newDocTitle: document.getElementById("newDocTitle") as HTMLInputElement,
  newDocType: document.getElementById("newDocType") as HTMLSelectElement,
  parentFolderSelect: document.getElementById("parentFolderSelect") as HTMLSelectElement,
  createDocBtn: document.getElementById("createDocBtn")!,
  docsList: document.getElementById("docsList")!,
  
  refreshQueueBtn: document.getElementById("refreshQueueBtn")!,
  forceSyncBtn: document.getElementById("forceSyncBtn")!,
  queueDisplay: document.getElementById("queueDisplay")!,
};

// --- Initialization ---

function init() {
  updateConnectionStatus();
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  
  els.setUserBtn.addEventListener("click", () => {
    currentUserId = els.userIdInput.value;
    syncEngine.setUserId(currentUserId);
    refreshAll();
    alert(`Switched to user: ${currentUserId}`);
  });

  els.createFolderBtn.addEventListener("click", createFolder);
  els.createDocBtn.addEventListener("click", createDoc);
  els.refreshQueueBtn.addEventListener("click", refreshQueue);
  els.forceSyncBtn.addEventListener("click", async () => {
    els.syncStatus.style.display = "inline-block";
    await syncEngine.sync();
    els.syncStatus.style.display = "none";
    refreshAll();
  });

  // Start initial sync/load
  syncEngine.setUserId(currentUserId);
  refreshAll();
  
  // Auto-refresh periodically to show sync updates
  setInterval(refreshAll, 5000);
}

function updateConnectionStatus() {
  if (navigator.onLine) {
    els.connectionStatus.textContent = "Online";
    els.connectionStatus.className = "badge online";
  } else {
    els.connectionStatus.textContent = "Offline";
    els.connectionStatus.className = "badge offline";
  }
}

async function refreshAll() {
  await Promise.all([refreshFolders(), refreshDocs(), refreshQueue()]);
}

// --- Folders ---

async function createFolder() {
  const name = els.newFolderName.value.trim();
  if (!name) return;
  
  const parentId = els.newFolderParentSelect.value || undefined;

  await folderService.create({ name, parentId, userId: currentUserId });
  els.newFolderName.value = "";
  await refreshFolders();
}

async function refreshFolders() {
  const folders = await folderService.getAll();
  
  // Update List
  els.foldersList.innerHTML = folders.length ? "<ul>" + folders.map(f => {
    const parent = f.parentId ? folders.find(p => p.id === f.parentId)?.name || f.parentId : "Root";
    return `<li>
      <strong>${f.name}</strong> <small>(Parent: ${parent})</small>
      <button onclick="deleteFolder('${f.id}')">❌</button>
    </li>`;
  }).join("") + "</ul>" : "<p>No folders found.</p>";

  // Update Parent Dropdown options
  const options = '<option value="">(No Parent)</option>' + 
    folders.map(f => `<option value="${f.id}">${f.name}</option>`).join("");
  
  els.parentFolderSelect.innerHTML = options;
  els.newFolderParentSelect.innerHTML = options;
}

(window as any).deleteFolder = async (id: string) => {
  if (!confirm("Delete folder and all contents?")) return;
  await folderService.remove(id);
  await refreshAll();
};

// --- Documents ---

async function createDoc() {
  const title = els.newDocTitle.value.trim();
  if (!title) return;
  
  const type = els.newDocType.value as any;
  const folderId = els.parentFolderSelect.value || undefined;

  await documentService.create({ 
    title, 
    type, 
    folderId, 
    userId: currentUserId,
    content: { text: "Initial content..." }
  });
  
  els.newDocTitle.value = "";
  await refreshDocs();
}

async function refreshDocs() {
  const docs = await documentService.getAll();
  
  els.docsList.innerHTML = docs.length ? "<ul>" + docs.map(d => 
    `<li>
      [${d.type.toUpperCase()}] <strong>${d.title}</strong>
      <br><small>Folder: ${d.folderId || "None"} |  Synced: ${d.syncedAt ? "✅" : "⏳"}</small>
      <button onclick="deleteDoc('${d.id}')">❌</button>
    </li>`
  ).join("") + "</ul>" : "<p>No documents found.</p>";
}

(window as any).deleteDoc = async (id: string) => {
  if (!confirm("Delete document?")) return;
  await documentService.remove(id);
  await refreshDocs();
};

// --- Queue ---

async function refreshQueue() {
  const queue = await db.syncQueue.toArray();
  els.queueDisplay.textContent = queue.length === 0 
    ? "No pending items (All synced)" 
    : JSON.stringify(queue, null, 2);
}

// Start
init();
