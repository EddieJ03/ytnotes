export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}

export const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
    console.log(date.toISOString());
    return date.toISOString().substring(11, 19);
};

