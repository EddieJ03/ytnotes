# YTNotes

A Chrome Extension to allow you to take notes during videos. If you'd like to try it out, follow these instructions:

1. Git clone this repo
2. Make sure to clone the backend repo and follow its instructions. Backend repo instructions can be found here: https://github.com/EddieJ03/ytnotes-backend
3. After you run the last instruction from the backend repo, something like the following should show up in terminal:
 ![After running minikube nodeapp-service](minikube_start_service.png)
 Take the number that shows up in the bottom one (or the X in http://127.0.0.1/X), and replace the PORT constant in `popup.js` with it! 
4. Open chrome and click "Manage Extensions": ![image](https://github.com/EddieJ03/ytnotes/assets/57547638/3eeb7236-37c5-4e92-b924-41df9b338473)
5. Toggle "Developer mode" in the upper-right corner to on
6. Click "Load unpacked" in the upper left and navigate to the cloned repo
7. You can now use this extension!

Add a Note While Watching:
![image](https://user-images.githubusercontent.com/57547638/175798629-a1c81e9a-7c4e-452b-91fe-b31f4e4a250f.png)

Edit Notes You Have Already Taken:
![image](https://user-images.githubusercontent.com/57547638/175798646-1b8cc024-df92-4ebd-a1c9-019135cfa825.png)

See All Notes for a Video:
![image](https://user-images.githubusercontent.com/57547638/175798714-396f5fb6-ab95-462a-ace6-0ae656d429b1.png)


