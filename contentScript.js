(() => {
  let youtubePlayer = null;

  const newVideoLoaded = () => {
    if(!youtubePlayer) {
      youtubePlayer = document.getElementsByClassName('video-stream')[0];
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if(type === "PAUSE") {
      youtubePlayer.pause();
    } else if(type === "TIME") {
      response(youtubePlayer.currentTime)
    }
  });

  newVideoLoaded();
})();