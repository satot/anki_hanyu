const apiKey = "";

async function getTranslations(text) {
  const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}&q=${encodeURIComponent(text)}&source=zh&target=ja&format=text`;
  const apiUrlPinyin = `https://helloacm.com/api/pinyin/?cached&s=${encodeURIComponent(text)}&t=1`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const translations = data.data.translations;

    if (translations && translations.length > 0) {
			const translationJA = translations[0].translatedText;
      // Get pinyin
      const responsePinyin = await fetch(apiUrlPinyin);
      const dataPinyin = await responsePinyin.json();
      const pinyin = dataPinyin.result.join(" ");

      return { translationJA, pinyin };
    }
  } catch (error) {
    console.error("An error occurred while fetching translations:", error);
  }

  return { translationJA: "", pinyin: "" };
}

async function generateSpeech(text) {
  const apiUrl = "https://texttospeech.googleapis.com/v1/text:synthesize";
  const requestData = {
    input: {
      text: text
    },
    voice: {
      languageCode: "cmn-Hans-CN",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      },
      body: JSON.stringify(requestData)
    });
    const data = await response.json();
    return data.audioContent;
  } catch (error) {
    console.error("An error occurred while generating speech:", error);
  }

  return null;
}

function toHexString(inputStr) {
  let hexString = '';
  for (let i = 0; i < inputStr.length; i++) {
    hexString += inputStr.charCodeAt(i).toString(16);
  }
  return hexString;
}

async function saveAudioToAnkiMediaFolder(audioFilename, audioContent) {
  const ankiAPIEndpoint = "http://localhost:8765";
  const requestData = {
    action: "storeMediaFile",
    version: 6,
    params: {
      filename: audioFilename,
      data: audioContent
    }
  };

  try {
    const response = await fetch(ankiAPIEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });
    const data = await response.json();
    if (data.error) {
      console.error("An error occurred while storing the audio file in Anki media folder:", data.error);
    } else {
      console.log("Audio file stored in Anki media folder successfully:", data.result);
    }
  } catch (error) {
    console.error("An error occurred while storing the audio file in Anki media folder:", error);
  }
}

async function addTextToAnki(info) {
  const text = info.selectionText;
  const { translationJA, pinyin } = await getTranslations(text);

  const audioContent = await generateSpeech(text);
  const audioFilename = toHexString(text) + ".mp3";
  const audioUrl = `[sound:${audioFilename}]`;

  if (audioContent) {
    await saveAudioToAnkiMediaFolder(audioFilename, audioContent);
  } else {
    console.log("Failed to decode audio content");
  }

  const ankiAPIEndpoint = "http://localhost:8765";
  const requestData = {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName: "Chinese",
        modelName: "Basic",
        fields: {
					Front: `${text}`,
          Back: `${translationJA}<br>${pinyin}<br>${audioUrl}`
        },
        tags: ["chrome-extension"],
        options: {
          allowDuplicate: true,
          duplicateScope: "deck",
        },
      }
    }
  };

  fetch(ankiAPIEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("An error occurred while adding the note to Anki:", data.error);
      } else {
        console.log("Note added to Anki successfully:", data.result);
      }
    })
    .catch((error) => {
      console.error("An error occurred while adding the note to Anki:", error);
    });
}

let contextMenuCreated = false;

if (!contextMenuCreated) {
  chrome.contextMenus.create({
    title: "Add to Anki",
    contexts: ["selection"],
    id: "add_to_anki",
  });
  contextMenuCreated = true;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add_to_anki") {
    const text = info.selectionText;
    addTextToAnki({ selectionText: text });
  }
});

