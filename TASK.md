# Development Tasks

## Current Tasks
- [ ] Implement basic camera functionality
- [x] Implement frame capture from video
- [x] Add basic object detection (using YOLO model)
- [x] Implement simple speed calculation (simulated)
- [ ] Implement continuous frame capture from video
- [ ] Implement tracking of ball movement over time
- [ ] Calculate actual speed from multiple frames
- [ ] Add ball trajectory visualization
- [ ] Implement calibration using a coin for scale
- [ ] Add ability to save and review previous putts
- [ ] Create test suite for detection functionality


## Completed Tasks
- [x] Set up basic project structure
- [x] Create initial index.html with camera access
- [x] Create UI layout with camera viewfinder
- [x] Create styles for the application
- [x] Add PWA capabilities (manifest, service worker)
- [x] Create placeholder icon images for PWA
- [x] Add PWA capabilities (app icons)
- [x] Implement frame capture from video
- [x] Add basic object detection (using YOLO model)


## Discovered During Work
- [ ] Need to create a calibration mode
- [ ] Need to improve detection performance on mobile devices


https://colab.research.google.com/github/EdjeElectronics/Train-and-Deploy-YOLO-Models/blob/main/Train_YOLO_Models.ipynb#scrollTo=zEEObQqoiGrs

https://labelstud.io/guide/install.html

# Model Conversion Instructions (from remote GitHub)

https://colab.research.google.com/github/EdjeElectronics/Train-and-Deploy-YOLO-Models/blob/main/Train_YOLO_Models.ipynb#scrollTo=Q19ENCHRQOCH

To convert model

[9]
4s
!pip install ultralytics tensorflow tensorflowjs

[10]
53s
from ultralytics import YOLO

model = YOLO("/content/my_model/my_model.pt")  # Replace with your model name
model.export(format="tf")  # This will create 'best_saved_model' folder

[11]
2s
import shutil

# Create a zip archive named "my_model_6.zip"
shutil.make_archive("/content/my_model_6", 'zip', "/content/my_model/my_model_web_model")
