import { getActiveTabURL, getTime } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bigDiv = document.createElement("div");
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const noteContents = document.createElement("p");

  bookmarkTitleElement.textContent = "Note at " + getTime(bookmark.timestamp);
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";
  noteContents.innerHTML = bookmark.note;
  noteContents.style.textAlign = "left";
  noteContents.style.margin = "5px";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);
  setBookmarkAttributes("edit", onEdit, controlsElement);
  
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
    bookmarksElement.innerHTML = '<p>No notes to show</p>';
  }
};

const onEdit = e => {
  const greatGrandParent = e.target.parentNode.parentNode.parentNode;
  const paragraph = greatGrandParent.children[1];
  greatGrandParent.removeChild(paragraph);
  const editNoteArea = document.createElement('textarea');
  editNoteArea.style.height = "100px";
  editNoteArea.style.width = "auto";
  editNoteArea.style.margin = "10px";
  editNoteArea.style.overflowY = "auto";
  editNoteArea.innerHTML = paragraph.innerHTML;
  greatGrandParent.appendChild(editNoteArea);

  // remove edit button and add save + cancel
  const bookmarks = e.target.parentNode;
  bookmarks.removeChild(e.target);
  setBookmarkAttributes("save", onSave, bookmarks);
  setBookmarkAttributes("cancel", (e) => onCancel(e, paragraph), bookmarks);
}

const onSave = (e) => {
  const grandParent = e.target.parentNode.parentNode;
  const greatGrandParent = grandParent.parentNode;
  const editArea = greatGrandParent.children[1];
  const newContents = editArea.value;
  const paragraph = document.createElement("p");
  paragraph.innerHTML = newContents;
  paragraph.style.textAlign = "left";
  paragraph.style.margin = "5px";
  greatGrandParent.removeChild(editArea);
  greatGrandParent.appendChild(paragraph);
  const bookmarks = e.target.parentNode;
  const cancel = bookmarks.children[3];
  const save = bookmarks.children[2];
  bookmarks.removeChild(cancel);
  bookmarks.removeChild(save);
  setBookmarkAttributes("edit", onEdit, bookmarks);
  editNote(grandParent.getAttribute("chrome-identity"), grandParent.getAttribute("video-id"), grandParent.getAttribute("timestamp"), newContents);
}

const onCancel = (e, oldContents) => {
  const greatGrandParent = e.target.parentNode.parentNode.parentNode;
  const editArea = greatGrandParent.children[1];
  const paragraph = document.createElement("p");
  paragraph.style.textAlign = "left";
  paragraph.style.margin = "5px";
  paragraph.innerHTML = oldContents.innerHTML;
  greatGrandParent.removeChild(editArea);
  greatGrandParent.appendChild(paragraph);
  const bookmarks = e.target.parentNode;
  const cancel = bookmarks.children[3];
  const save = bookmarks.children[2];
  bookmarks.removeChild(cancel);
  bookmarks.removeChild(save);
  setBookmarkAttributes("edit", onEdit, bookmarks);
}

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

  const parentElement = bookmarkElementToDelete.parentNode;

  const grandparentElement = parentElement.parentNode;

  grandparentElement.removeChild(parentElement);

  if(grandparentElement.childElementCount === 0) {
    grandparentElement.innerHTML = `<p>No notes to show</p>`
  }

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
  if(bookmarksElement.innerHTML === '<p>No notes to show</p>') {
    bookmarksElement.innerHTML = "";
  }
  
  addNewBookmark(bookmarksElement, obj);
}

const getNotes = async (chromeIdentity, currentVideo) => {
  try {
    const response = await fetch(`https://tubenotes-server.herokuapp.com/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}`, {
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
    let response = await fetch(`https://tubenotes-server.herokuapp.com/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}&note=${note}&timestamp=${timestamp}`, {
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
    await fetch(`https://tubenotes-server.herokuapp.com/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}&timestamp=${timestamp}`, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
    })
  } catch(err) {
    console.log(err);
  }
}

const editNote = async (chromeIdentity, currentVideo, timestamp, newNote) => {
  try {
    await fetch(`https://tubenotes-server.herokuapp.com/?chrome_identity_id=${chromeIdentity}&video_id=${currentVideo}&note=${newNote}&timestamp=${timestamp}`, {
      method: 'PATCH', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
    })
  } catch(err) {
    console.log(err);
  }
}

const save = async (chromeIdentity, currentVideo, allNotes, activeTab) => {
  const savedNote = document.getElementById("my-note");
  let noteContents = savedNote.value;

  if(noteContents.length === 0) return;

  let time = await chrome.tabs.sendMessage(activeTab.id, {
    type: "TIME"
  });

  // remove textarea
  const canceledNote = document.getElementById("newnote");
  canceledNote.parentNode.removeChild(canceledNote);
  document.getElementById("note-button").disabled = false;

  let newNote = await saveNote(chromeIdentity, currentVideo, noteContents, time);

  allNotes = [...allNotes, newNote];

  addBookmark(newNote);
}

document.addEventListener("DOMContentLoaded", () => {

  let allNotes = [];

  chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, async (data) => {
    const chromeIdentity = data.id;
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const currentVideo = urlParameters.get("v");

    document.getElementById("note-button").addEventListener("click", async () => {
      document.getElementById("note-button").disabled = true;
      
      await chrome.tabs.sendMessage(activeTab.id, {
        type: "PAUSE"
      });

      let time = await chrome.tabs.sendMessage(activeTab.id, {
        type: "TIME"
      });

      for(let i = 0; i < allNotes.length; i++) {
        if(allNotes[i].timestamp === time) {
          document.getElementById("note-button").disabled = false;
          return;
        }
      }    

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
      noteArea.style.height = "150px";

      const buttonDiv = document.createElement("div");
      buttonDiv.className = "newnote-buttons";

      const saveButton = document.createElement("button");
      saveButton.className = "btn btn-primary";
      saveButton.innerHTML = "Save";
      saveButton.addEventListener("click", () => save(chromeIdentity, currentVideo, allNotes, activeTab));

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
      const popup = document.getElementById("entire-popup");
      popup.style.display = "none";
      const spinner = document.createElement("div");
      spinner.className = "spinner-border";
      document.body.appendChild(spinner);
      allNotes = await getNotes(chromeIdentity, currentVideo);
      document.body.removeChild(spinner);
      popup.style.display = "block";
      viewBookmarks(allNotes);
    } else {
      const container = document.getElementsByClassName("container")[0];
      const noteButton = document.getElementById("note-button");
      noteButton.style.display = "none";
      container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
    }
  });
});

