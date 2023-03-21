document.getElementById("addButton").addEventListener("click", async () => {
  const selectedText = await getSelectedText();
  if (selectedText) {
    chrome.runtime.sendMessage({ action: "addTextToAnki", text: selectedText });
  }
});

function getSelectedText() {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: chrome.tabs.TAB_ID_NONE },
        function: () => {
          return window.getSelection().toString();
        },
      },
      (selection) => {
        resolve(selection[0].result);
      }
    );
  });
}
