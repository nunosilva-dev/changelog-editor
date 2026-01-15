let currentRootPath = "";
let currentModulePath = "";
let existingMD = "";
let editMode = 'builder';
const categories = ["Added", "Changed", "Fixed", "Removed", "Deprecated", "Security"];
let currentLayout = 'split';

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
    const path = await globalThis.electronAPI.selectFolder();
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
    const btn = document.getElementById('toggleEditMode');
    if (editMode === 'builder') {
        editMode = 'raw';
        btn.innerText = "Builder";
        document.getElementById('rawEditor').value = generateMarkdown();
    } else {
        editMode = 'builder';
        btn.innerText = "RAW";
        existingMD = document.getElementById('rawEditor').value;
        renderContent();
    }
    setLayout(currentLayout);
};

globalThis.refreshTree = async function () {
    if (!currentRootPath) return;
    treeContainer.innerHTML = "";
    const folderName = currentRootPath.split('/').pop() || currentRootPath;
    const rootNode = await createTreeNode(currentRootPath, `${folderName}`, true);
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
    row.className = `tree-item group flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-all mb-0.5 ${isRoot ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`;

    const childrenContainer = document.createElement('div');
    childrenContainer.className = "ml-4 border-l border-slate-200 dark:border-slate-800 pl-1 hidden";

    const arrowIcon = document.createElement('span');
    arrowIcon.className = "arrow-icon w-4 h-4 flex items-center justify-center mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors";
    arrowIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;

    const folderIcon = document.createElement('span');
    folderIcon.className = "mr-2 opacity-70";
    folderIcon.innerText = isRoot ? "📦" : "📁";

    const label = document.createElement('span');
    label.className = "truncate text-[13px] tracking-tight select-none flex-1";
    label.innerText = displayName;

    if (!isRoot) row.appendChild(arrowIcon);
    row.appendChild(folderIcon);
    row.appendChild(label);

    const toggleNode = async (forceOpen = false) => {
        const isHidden = childrenContainer.classList.contains('hidden');

        if (forceOpen && !isHidden) return;

        if (isHidden) {
            childrenContainer.classList.remove('hidden');
            arrowIcon.classList.add('expanded');
            folderIcon.innerText = isRoot ? "📦" : "📂";

            if (childrenContainer.innerHTML === "") {
                const folders = await globalThis.electronAPI.scanDir(fullPath);
                folders.sort();
                for (const name of folders) {
                    childrenContainer.appendChild(await createTreeNode(`${fullPath}/${name}`, name));
                }
            }
        } else {
            childrenContainer.classList.add('hidden');
            arrowIcon.classList.remove('expanded');
            folderIcon.innerText = isRoot ? "📦" : "📁";
        }
    };

    arrowIcon.onclick = (e) => {
        e.stopPropagation();
        toggleNode();
    };

    row.onclick = async (e) => {
        e.stopPropagation();

        document.querySelectorAll('.selected-node').forEach(n => n.classList.remove('selected-node', 'bg-indigo-50', 'dark:bg-indigo-900/30'));

        row.classList.add('selected-node', 'bg-indigo-50', 'dark:bg-indigo-900/30');

        await toggleNode(true);

        loadFolder(fullPath);
    };

    wrapper.append(row, childrenContainer);
    return wrapper;
}

async function loadFolder(path) {
    currentModulePath = path;
    const folderName = path.split('/').pop();
    const rootFolderName = currentRootPath.split('/').pop();
    const relativePath = path === currentRootPath ? "" : path.substring(currentRootPath.length);

    activeItemName.innerText = folderName;

    activeItemPath.innerText = (rootFolderName + relativePath).split('/').filter(Boolean).join(' / ');

    editorUI.classList.remove('hidden');
    emptyState.classList.add('hidden');

    categories.forEach(cat => document.getElementById(`input-${cat}`).value = "");
    existingMD = await globalThis.electronAPI.readFile(`${path}/changelog.md`);

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
        return block + (existingMD || "");
    }
}

async function publishChanges() {
    const filePath = `${currentModulePath}/changelog.md`;
    let finalMD = editMode === 'raw' ? document.getElementById('rawEditor').value : generateMarkdown();
    await globalThis.electronAPI.writeFile(filePath, finalMD);
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

    if (link?.href) {
        event.preventDefault();
        globalThis.electronAPI.openExternal(link.href);
    }
});

globalThis.setLayout = function (mode) {
    currentLayout = mode;
    const builderView = document.getElementById('builderView');
    const rawView = document.getElementById('rawView');
    const previewContainer = document.getElementById('previewContainer');
    const btns = document.querySelectorAll('.layout-btn');

    btns.forEach((btn, index) => {
        const isSelected = (mode === 'editor' && index === 0) ||
            (mode === 'split' && index === 1) ||
            (mode === 'preview' && index === 2);

        if (isSelected) {
            btn.className = "layout-btn text-indigo-600 bg-white dark:bg-slate-600 shadow-sm p-1.5 rounded-md transition ring-1 ring-slate-200 dark:ring-slate-500";
        } else {
            btn.className = "layout-btn p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition";
        }
    });

    builderView.classList.remove('w-7/12', 'w-full', 'hidden');
    rawView.classList.remove('w-7/12', 'w-full', 'hidden');
    previewContainer.classList.remove('w-5/12', 'w-full', 'border-l', 'hidden');

    if (mode === 'preview') {
        builderView.classList.add('hidden');
        rawView.classList.add('hidden');
        previewContainer.classList.add('w-full');
    } else {
        const widthClass = mode === 'split' ? 'w-7/12' : 'w-full';
        if (editMode === 'raw') {
            rawView.classList.add(widthClass);
            builderView.classList.add('hidden');
        } else {
            builderView.classList.add(widthClass);
            rawView.classList.add('hidden');
        }

        if (mode === 'split') {
            previewContainer.classList.add('w-5/12', 'border-l');
        } else {
            previewContainer.classList.add('hidden');
        }
    }
}