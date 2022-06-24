import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bigDiv = document.createElement("div");
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const noteContents = document.createElement("p");

  bookmarkTitleElement.textContent = bookmark.timestamp;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";
  console.log("bookmark.contents");
  noteContents.innerHTML = bookmark.note;

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);
  
  newBookmarkElement.id = "bookmark-" + bookmark.timestamp;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.timestamp); 
  newBookmarkElement.setAttribute("chrome-identity", bookmark.chrome_identity_id); 
  newBookmarkElement.setAttribute("video-id", bookmark.video_id); 

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bigDiv.appendChild(newBookmarkElement);
  bigDiv.appendChild(noteContents);
  bigDiv.className = "bookmark-item-div";
  bookmarks.appendChild(bigDiv);
};

const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<p>No bookmarks to show</p>';
  }
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const chromeIdentity = e.target.parentNode.parentNode.getAttribute("chrome-identity");
  const videoId = e.target.parentNode.parentNode.getAttribute("video-id");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  await deleteNote(chromeIdentity, videoId, bookmarkTime)
};

const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

const addBookmark = async (obj) => {
  const bookmarksElement = document.getElementById("bookmarks");
  if(bookmarksElement.innerHTML === '<p>No bookmarks to show</p>') {
    bookmarksElement.innerHTML = "";
  }
  
  addNewBookmark(bookmarksElement, obj);
}

const getNotes = async (chromeIdentity, currentVideo) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}`, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
    })
  
    const data = await response.json()
    return data;
  } catch(err) {
    console.log(err);
  }
}

const saveNote = async (chromeIdentity, currentVideo, note, timestamp) => {
  try {
    let response = await fetch(`http://127.0.0.1:5000/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}&note=${note}&timestamp=${timestamp}`, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
    })

    let data = await response.json();
    return data;
  } catch(err) {
    console.log(err);
  }
}

const deleteNote = async (chromeIdentity, currentVideo, timestamp) => {
  try {
    await fetch(`http://127.0.0.1:5000/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}&timestamp=${timestamp}`, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
    })
  } catch(err) {
    console.log(err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let information = await chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'});
  const chromeIdentity = information.id;
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  const currentVideo = urlParameters.get("v");

  let allNotes = [];

  document.getElementById("note-button").addEventListener("click", () => {
    document.getElementById("note-button").disabled = true;

    chrome.tabs.sendMessage(activeTab.id, {
      type: "PAUSE"
    });

    let bookmarkArea = document.getElementById("bookmarks");

    const newNote = document.createElement("div");
    newNote.className = "newnote";
    newNote.id = "newnote";

    const noteArea = document.createElement("textarea");
    noteArea.id = "my-note"
    noteArea.contentEditable = true;
    noteArea.placeholder = "add a note here!";
    noteArea.style.marginTop = "15px";
    noteArea.style.width = "300px";
    noteArea.style.height = "200px";

    const buttonDiv = document.createElement("div");
    buttonDiv.className = "newnote-buttons";

    const saveButton = document.createElement("button");
    saveButton.className = "btn btn-primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener("click", () => {
      const saveNote = document.getElementById("my-note");
      let noteContents = saveNote.value;

      // remove textarea
      const canceledNote = document.getElementById("newnote");
      canceledNote.parentNode.removeChild(canceledNote);
      document.getElementById("note-button").disabled = false;

      let response = await chrome.tabs.sendMessage(activeTab.id, {
        type: "TIME"
      });

      for(let i = 0; i < allNotes.length; i++) {
        if(allNotes[i].timestamp === parseFloat(response)) {
          return;
        }
      }

      let newNote = await saveNote(chromeIdentity, currentVideo, noteContents, response);

      allNotes = [...allNotes, newNote];

      addBookmark(newNote);
    });

    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-primary";
    cancelButton.innerHTML = "Cancel";

    cancelButton.addEventListener("click", () => {
      const canceledNote = document.getElementById("newnote");
      canceledNote.parentNode.removeChild(canceledNote);
      document.getElementById("note-button").disabled = false;
    });

    buttonDiv.appendChild(saveButton);
    buttonDiv.appendChild(cancelButton);
    newNote.appendChild(noteArea);
    newNote.appendChild(buttonDiv);
    bookmarkArea.appendChild(newNote);
  })

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    allNotes = await getNotes(chromeIdentity, currentVideo);
    viewBookmarks(allNotes);
  } else {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
  }
});

