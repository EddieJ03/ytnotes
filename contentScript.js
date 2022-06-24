(() => {
  let youtubePlayer = null;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  // change back to async
  const addNewBookmarkEventHandler = (text) => {
    const currentTime = youtubePlayer.currentTime;

    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
      contents: text
    };

    return newBookmark;
  };

  const addNewBookmarkBack = async (newBookmark) => {
    console.log("adding bookmark back");
    currentVideoBookmarks = await fetchBookmarks();

    currentVideoBookmarks = [...currentVideoBookmarks, newBookmark]

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks.sort((a, b) => a.time - b.time))
    });
  }

  const newVideoLoaded = async () => {
    currentVideoBookmarks = await fetchBookmarks();

    if(!youtubePlayer) {
      youtubePlayer = document.getElementsByClassName('video-stream')[0];
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      console.log(value);
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
      chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
      response(currentVideoBookmarks);
    } else if(type === "ADD") {
      let newBookMark = addNewBookmarkEventHandler(value);
      console.log(newBookMark);
      response(newBookMark);
    } else if(type === "ADD_BACK") {
      addNewBookmarkBack(value);
    } else if(type === "PAUSE") {
      youtubePlayer.pause();
    } else if(type === "TIME") {
      response(youtubePlayer.currentTime)
    }
  });

  newVideoLoaded();
})();

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
