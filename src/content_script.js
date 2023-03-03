const buttonOuterHTMLFallback = `<button class="btn flex justify-center gap-2 btn-neutral" id="download-png-button">Try Again</button>`;

async function init() {
    if (window.buttonsInterval) {
        clearInterval(window.buttonsInterval);
    }
    window.buttonsInterval = setInterval(() => {
        const actionsArea = document.querySelector("form>div>div");
        if (!actionsArea) {
            return;
        }
        if (shouldAddButtons(actionsArea)) {
            let TryAgainButton = actionsArea.querySelector("button");
            if (!TryAgainButton) {
                const parentNode = document.createElement("div");
                parentNode.innerHTML = buttonOuterHTMLFallback;
                TryAgainButton = parentNode.querySelector("button");
            }
            addActionsButtons(actionsArea, TryAgainButton);
        }
    }, 200);
}


function shouldAddButtons(actionsArea) {
    // first, check if there's a "Try Again" button and no other buttons
    const buttons = actionsArea.querySelectorAll("button");
    const hasTryAgainButton = Array.from(buttons).some((button) => {
        return !button.id?.includes("download");
    });
    if (hasTryAgainButton && buttons.length === 1) {
        return true;
    }

    // otherwise, check if open screen is not visible
    const isOpenScreen = document.querySelector("h1.text-4xl");
    if (isOpenScreen) {
        return false;
    }

    // check if the conversation is finished and there are no share buttons
    const finishedConversation = document.querySelector("form button>svg");
    const hasShareButtons = actionsArea.querySelectorAll("button[share-ext]");
    return finishedConversation && !hasShareButtons.length;
}


function addActionsButtons(actionsArea, TryAgainButton) {
    const cloneButton = (name, onclick, text = `Generate ${name}`) => {
        const downloadButton = TryAgainButton.cloneNode(true);
        downloadButton.id = `download-${name}-button`;
        downloadButton.setAttribute("share-ext", "true");
        downloadButton.title = text;
        downloadButton.innerHTML = setIcon(name);
        // downloadButton.innerText = text;
        downloadButton.onclick = onclick
        actionsArea.appendChild(downloadButton);
    }
    cloneButton('markdown', () => exportMarkdown());
}

function getName() {
    const name = document.querySelector('nav .overflow-y-auto a.hover\\:bg-gray-800')?.innerText?.trim() || '';
    return name.replace(/[/\\?%*:|"<>]/g, '');
}

function setIcon(type) {
    return {
        markdown: `<svg class="chatappico md" viewBox="0 0 1024 1024" width="20" height="20"><path d="M128 128h768a42.666667 42.666667 0 0 1 42.666667 42.666667v682.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H128a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m170.666667 533.333333v-170.666666l85.333333 85.333333 85.333333-85.333333v170.666666h85.333334v-298.666666h-85.333334l-85.333333 85.333333-85.333333-85.333333H213.333333v298.666666h85.333334z m469.333333-128v-170.666666h-85.333333v170.666666h-85.333334l128 128 128-128h-85.333333z" p-id="1381" fill="currentColor"></path></svg>`,
    }[type];
}

async function exportMarkdown() {
    const content = Array.from(document.querySelectorAll("main >div>div>div>div")).map(i => {
        let j = i.cloneNode(true);
        if (/dark:bg-gray-800/.test(i.getAttribute('class'))) {
            j.innerHTML = `<blockquote>${i.innerHTML}</blockquote>`;
        }

        // add `Q:` before
        const questionElements = j.querySelectorAll(".dark\\:bg-gray-800");
        for (let qElem of questionElements) {
            qElem.textContent = `Q: ${qElem.textContent}`;
        }

        return j.innerHTML;
    }).join('<hr />');
    const data = ExportMD.turndown(content);
    const filename = getName();
    const dataStr = "data:text/md;charset=utf-8," + encodeURIComponent(data);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${filename}.md`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

var ExportMD = (function () {
    if (!TurndownService || !turndownPluginGfm) return;
    const hljsREG = /^.*(hljs).*(language-[a-z0-9]+).*$/i;
    const gfm = turndownPluginGfm.gfm
    const turndownService = new TurndownService({
        hr: '---'
    })
        .use(gfm)
        .addRule('code', {
            filter: (node) => {
                if (node.nodeName === 'CODE' && hljsREG.test(node.classList.value)) {
                    return 'code';
                }
            },
            replacement: (content, node) => {
                const classStr = node.getAttribute('class');
                if (hljsREG.test(classStr)) {
                    const lang = classStr.match(/.*language-(\w+)/)[1];
                    if (lang) {
                        return `\`\`\`${lang}\n${content}\n\`\`\``;
                    }
                    return `\`\`\`\n${content}\n\`\`\``;
                }
            }
        })
        .addRule('ignore', {
            filter: ['button', 'img'],
            replacement: () => '',
        })
        .addRule('table', {
            filter: 'table',
            replacement: function (content, node) {
                return `\`\`\`${content}\n\`\`\``;
            },
        });

    return turndownService;
}({}));

// run init
if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
) {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}
