let currentRootPath = "";
let currentModulePath = "";
let existingMD = "";
let editMode = 'builder';
const categories = ["Added", "Changed", "Fixed", "Removed", "Deprecated", "Security"];

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const treeContainer = document.getElementById('treeContainer');
const editorUI = document.getElementById('editorUI');
const emptyState = document.getElementById('emptyState');
const publishModal = document.getElementById('publishModal');
const activeItemName = document.getElementById('activeItemName');
const activeItemPath = document.getElementById('activeItemPath');

tailwind.config = {darkMode: 'class'};

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    themeIcon.innerText = "☀️";
}

themeToggle.onclick = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    themeIcon.innerText = isDark ? "☀️" : "🌙";
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

const textareas = document.querySelectorAll('textarea[id^="input-"]');
textareas.forEach(area => {
    area.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            const start = area.selectionStart;
            const end = area.selectionEnd;
            const value = area.value;
            const lastNewLine = value.lastIndexOf('\n', start - 1);
            const currentLine = value.substring(lastNewLine + 1, start);

            if (currentLine.trim().length > 0) {
                e.preventDefault();
                const insertion = "\n  - ";
                area.value = value.substring(0, start) + insertion + value.substring(end);
                area.selectionStart = area.selectionEnd = start + insertion.length;
            }
        }
    });
});

document.getElementById('btnOpen').onclick = async () => {
    const path = await window.electronAPI.selectFolder();
    if (!path) return;
    currentRootPath = path;
    await refreshTree();
    const firstNode = treeContainer.querySelector('.tree-item');
    if (firstNode) firstNode.click();
};

document.getElementById('btnOpenModal').onclick = () => publishModal.classList.remove('hidden');
document.getElementById('cancelModal').onclick = () => publishModal.classList.add('hidden');
document.getElementById('confirmPublish').onclick = async () => {
    publishModal.classList.add('hidden');
    await publishChanges();
};

document.getElementById('toggleEditMode').onclick = () => {
    const builder = document.getElementById('builderView');
    const raw = document.getElementById('rawView');
    const btn = document.getElementById('toggleEditMode');
    if (editMode === 'builder') {
        editMode = 'raw';
        builder.classList.add('hidden');
        raw.classList.remove('hidden');
        btn.innerText = "Builder Mode";
    } else {
        editMode = 'builder';
        raw.classList.add('hidden');
        builder.classList.remove('hidden');
        btn.innerText = "Raw Editor";
        existingMD = document.getElementById('rawEditor').value;
        renderContent();
    }
};

window.refreshTree = async function () {
    if (!currentRootPath) return;
    treeContainer.innerHTML = "";
    const folderName = currentRootPath.split('/').pop() || currentRootPath;
    const rootNode = await createTreeNode(currentRootPath, `📦 ${folderName}`, true);
    treeContainer.appendChild(rootNode);
}

function getLatestVersion(md) {
    const regex = /##\s*\[v?(\d+\.\d+\.\d+)\]/i;
    const match = md.match(regex);
    return match ? match[1] : "";
}

async function createTreeNode(fullPath, displayName, isRoot = false) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    row.className = `tree-item flex items-center py-2.5 px-4 rounded-xl cursor-pointer transition-all mb-1 ${isRoot ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-2' : 'text-slate-500'}`;
    row.innerHTML = `<span class="truncate text-[12px] font-bold uppercase tracking-tight">${displayName}</span>`;

    const children = document.createElement('div');
    children.className = "ml-6 border-l-2 border-slate-100 dark:border-slate-800 hidden";

    row.onclick = async (e) => {
        e.stopPropagation();
        document.querySelectorAll('.selected-node').forEach(n => n.classList.remove('selected-node'));
        row.classList.add('selected-node');

        if (children.classList.contains('hidden')) {
            children.classList.remove('hidden');
            if (children.innerHTML === "") {
                const folders = await window.electronAPI.scanDir(fullPath);
                for (const name of folders) {
                    children.appendChild(await createTreeNode(`${fullPath}/${name}`, name));
                }
            }
        } else {
            children.classList.add('hidden');
        }
        loadFolder(fullPath);
    };

    wrapper.append(row, children);
    return wrapper;
}

async function loadFolder(path) {
    currentModulePath = path;
    const folderName = path.split('/').pop();
    const rootFolderName = currentRootPath.split('/').pop();
    const relativePath = path === currentRootPath ? "" : path.substring(currentRootPath.length);

    activeItemName.innerText = folderName;

    const displayPath = (rootFolderName + relativePath).split('/').filter(Boolean).join(' / ');
    activeItemPath.innerText = displayPath;

    editorUI.classList.remove('hidden');
    emptyState.classList.add('hidden');

    categories.forEach(cat => document.getElementById(`input-${cat}`).value = "");
    existingMD = await window.electronAPI.readFile(`${path}/changelog.md`);

    const latestVer = getLatestVersion(existingMD);
    document.getElementById('versionTag').value = latestVer || "";
    renderContent();
}

function renderContent() {
    document.getElementById('historyPreview').innerHTML = marked.parse(existingMD || "*No existing changelog.*");
    document.getElementById('rawEditor').value = existingMD;
}

function generateMarkdown() {
    const version = document.getElementById('versionTag').value.trim() || "Unreleased";
    const versionHeader = `## [${version}]`;
    const newEntries = {};
    categories.forEach(cat => {
        const val = document.getElementById(`input-${cat}`).value.trim();
        if (val) newEntries[cat] = val.split('\n').map(l => l.startsWith('- ') || l.startsWith('  - ') ? l : `- ${l}`).join('\n');
    });

    if (existingMD.includes(versionHeader)) {
        let sections = existingMD.split(/(?=\n## \[)/);
        sections = sections.map(section => {
            if (section.trim().startsWith(versionHeader)) {
                let updated = section;
                categories.forEach(cat => {
                    if (newEntries[cat]) {
                        const sub = `### ${cat}`;
                        updated = updated.includes(sub) ? updated.replace(sub, `${sub}\n${newEntries[cat]}`) : updated.trimEnd() + `\n\n${sub}\n${newEntries[cat]}\n`;
                    }
                });
                return updated;
            }
            return section;
        });
        return sections.join('');
    } else {
        let block = `${versionHeader}\n\n`;
        categories.forEach(cat => {
            if (newEntries[cat]) block += `### ${cat}\n${newEntries[cat]}\n\n`;
        });
        return block + (existingMD ? existingMD : "");
    }
}

async function publishChanges() {
    const filePath = `${currentModulePath}/changelog.md`;
    let finalMD = editMode === 'raw' ? document.getElementById('rawEditor').value : generateMarkdown();
    await window.electronAPI.writeFile(filePath, finalMD);
    existingMD = finalMD;
    if (editMode === 'builder') categories.forEach(cat => document.getElementById(`input-${cat}`).value = "");
    renderContent();
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

document.getElementById('historyPreview').addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (link && link.href) {
        event.preventDefault();
        window.electronAPI.openExternal(link.href);
    }
});