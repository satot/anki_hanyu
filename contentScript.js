document.addEventListener('mouseup', () => {
  try {
    const selection = window.getSelection().toString().trim();

    if (selection) {
      createPopup(selection);
    } else {
      removePopup();
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
});

document.addEventListener('keydown', () => {
  try {
    removePopup();
  } catch (error) {
    console.error('An error occurred:', error);
  }
});

function createPopup(text) {
  removePopup();

  const popup = document.createElement('div');
  popup.id = 'anki-text-adder-popup';
  popup.style.cssText = `
    position: absolute;
    z-index: 10000;
    padding: 0.25rem;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.9);
    background-image: url(${chrome.runtime.getURL('icon.png')});
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    width: 24px;
    height: 24px;
    cursor: pointer;
  `;

  popup.addEventListener('mousedown', () => {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'addTextToAnki', text });
      removePopup();
    }, 1);
  });

  document.body.appendChild(popup);
  positionPopup();
}

function positionPopup() {
  const popup = document.getElementById('anki-text-adder-popup');
  if (popup) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup.style.top = `${window.scrollY + rect.top - popup.offsetHeight/2}px`;
    popup.style.left = `${window.scrollX + rect.right}px`;
  }
}

function removePopup() {
  const existingPopup = document.getElementById('anki-text-adder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
}
