---
name: Testing Checklist
about: 'Use this checklist to test new versions of StraboField '
title: User Testing Testing
labels: testing
assignees: ''

---

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - StraboSpot Version [e.g. 1.84]

## Application Testing
  Testing the app is an important task to ensure the usability, functionality and design. Application testing should be preformed for new versioning before and after deployment to the App store (Apple) or Play Store (Google). If one or more checks fail then an issue must be started with specific descriptions of the failure and the steps taken to arrive at the failure. 

If any item fails the test please create an issue by clicking the `Issues` link above and provide as much detail about the failure, including the steps takes to come to the failure, as possible so we can attempt to recreate the failure and triage.

The main testing parameters will include:

  - Device Checks - Testing application functionality on different devices
  - Network Checks - Testing application functionality in various network connectivity settings
  - App Specific Checks - Testing application functions, both commonly used and discipline specific
  - User Interface Checks - Reviewing user interface (UI) appearance and intuitiveness

Please perform the checks in the following areas and submit an issue when needed. The checks don’t have to be executed in the order they are given.

If you have any questions or suggestions, please contact us at strabospot@gmail.com.

**If you find a problem with the app please click the `Issues` button above and fill out a ticket.**  

***
### Device [est. 3 min]
_**Follow the instructions below and report any issues, bugs, or unexpected actions while using StraboField. Use any and all devices you have available (apple, android, phone, tablet). **_


#### Device Testing
- [ ] Uninstall StraboField on your device
- [ ] Install StraboField on your device from the application store
- [ ] Open a project from device or server
- [ ] Use the app (options for 'use the app:' add spots, lines, polygons, take images, sketch and create image basemaps, collect samples, take measurements, add notes, create and add tags, change map baselayers, move around on the map, add rock types) 
- [ ] Have a friend or neighbor call or text you while using the app. Alternatively, text yourself from a different device
- [ ] Try using the device while you have timed notification delivery (social media applications, game invites)
- [ ] Add spots and use the app, turn off your GPS, keep using the app (add metadata, take measurements, add spots), turn GPS back on
- [ ] Click the home menu icon, close the home menu
- [ ] Click the notebook icon, close the notebook 
- [ ] Route to a grocery store with your phone map application, switch back to the StraboField app and continue use
- [ ] Play music or a video on your phone, switch back to StraboField and use the app 

Device Specifics: 
- [ ] Is functionality defined for all device buttons or keys when the app is in use?
- [ ] If the device has a “**back**” button, does the “back” button take user to the previous screen?
- [ ] Are all touch screen positions (buttons) working when a screen protector is used?
- [ ] Does the app interfere with other apps when in background/multitasking mode (using GPS, playing music, etc.)?

***
### Network Specific Check [est. 4 min]
_**Follow the instructions below and report any issues, bugs, or unexpected actions while using StraboField. Use any and all devices you have available (apple, android, phone, tablet). **_
- [ ] Open StraboField and use the app (options for 'use the app:' add spots, lines, polygons, take images, sketch and create image basemaps, collect samples, take measurements, add notes, create and add tags, change map baselayers, move around on the map, add rock types) 
- [ ] Turn on wifi, continue using StraboField
- [ ] Turn off wifi, continue using StraboField 
- [ ] Turn on airplane mode on device, continue using StraboField
- [ ] Turn off airplane mode on device, continue using StraboField
- [ ] Connect via bluetooth to a different device or use your device as a hotspot, continue using StraboField 
- [ ] Walk to a notorious service deadzone (if you have one), use StraboField

***
### Login [est. 1 min]
- [ ] Log out of your StraboField account on the application (Home Menu > Manage: My StraboSpot > Log out) 
- [ ] Log back into your StraboField account 

***
### Manage
#### My StraboSpot [est. 3 min] 
- [ ] Upload your current StraboField project to the server (Home > Manage: Upload and Backup) 
- [ ] Backup your current project to your device
- [ ] Start a new project (Home > Manage: My StraboSpot > Start a New Project). Add a few spots 
- [ ] Switch to a new project from server or device (Home > Manage: My StraboSpot) 
- [ ] Able to export/import project to device?
- [ ] Do all the buttons on Manage Project page function correctly?

#### Active Project [4 min.]
- [ ] Edit the active project name (Home > Manage: Active Project > Active Project: > Basic Info: Project Name)
- [ ] Create a new dataset (Home > Manage: Active Project > Project Datasets > + Button)
- [ ] Delete new dataset (Home > Manage: Active Project > Project Datasets > Pencil Button)
- [ ] Add new daily note (Home > Manage: Active Project > Active Project: > Daily Notes > Add New Daily Note)
- [ ] Delete new daily note
- [ ] Add new technical details (Instruments, GPS datum, magnetic declination)? (Home > Manage: Active Project > Active Project: > Technical Details)
- [ ] Add general details (ORCID, other team members, area of interest, purpose of study, grant ID, funding agency)?
- [ ] Make project public using toggle in Privacy Settings section
- [ ] Make project private using toggle in Privacy Settings section
- [ ] Any UI or functional concerns?

#### Preferences [est. 1 min]
- [ ] Home Menu > Preferences > Shortcuts > Able to toggle page controls?  
- [ ] Home Menu > Preferences > Naming Conventions > Able to enter naming conventions for spots? For image basemaps/strat section spots? For samples? 
- [ ] Preferences > Miscellaneous > Able to toggle Testing Mode on/off? 
- [ ] Help > Documentation > Able to open and close files? 

***
### Maps 
#### Main Map [est. 3 min]
- [ ] Do all the buttons on Main Map page function correctly? 
- [ ] Open/Close the home menu
- [ ] Open/Close the notebook panel
- [ ] Add a spot to the map
- [ ] Add a line to the map
- [ ] Add a polygon to the map
- [ ] Add a spot within your polygon spot (To view spot nesting: open the notebook panel, select your spot within your polygon spot, click the 3 dot button in the top right of your notebook panel, choose Show Nesting. Verify the new spot is nested within the polygon spot)
- [ ] Edit your line spots to change the orientation/shape of the line (or a polygon)
- [ ] Click the 3 dot Map Actions button, choose an action to test (or test all 6!)
- [ ] In the 3 dot Map Action menu, add a tag to a spot. If no tags are defined, please create a new testing tag
- [ ] Click the star Map Symbols button, turn on and off features, labels, only 1st measurements, and tag colors 
- [ ] Click the layer Map Layers button
- [ ] Move around on the map, do additional tiles load?

#### Baselayers (Mapbox Style, Classic, Topo, Satellite, and OpenLayers) [est. 3 min]
- [ ] If online, click the layer Map Layer button and select a new baselayer
- [ ] Open Home Menu > MAPS > Manage Offline Maps > Download tiles of current map
- [ ] Change your basemap using the layer Map Layers button on the main map view. Download tiles for offline use again (previous step)
- [ ] Navigate to Manage Offline Maps section and verify you have 2 different basemap tiles saved for offline use. (Home Menu > MAPS > Manage Offline Maps)
- [ ] If you have custom maps in your StraboSpot Account > My Maps: are you able to overlay the custom maps and vary the transparency?

#### Main Map [est. 1 min]
- [ ] Open the application and close home menu and notebook panel, is the main map visible?
- [ ] Click the navigation button in the lower left corner, does the map move to your current location? 
- [ ] Zoom in and out of map with + and - buttons and/or pinching-in/pinch-out fingers on screen

#### Image Basemaps [est. 2 min]
- [ ] Open a spot and take an image
- [ ] Turn the image into an image basemap (toggle under image in the notebook panel)
- [ ] Open the image basemap and add a spot, line, and polygon
- [ ] Edit the line and polygon spots to change the shape of your initial line/polygon
- [ ] Open the image information and calculate image width

#### Other Basemaps [est. 1 min if you have additional basemaps]
- [ ] Add other basemaps from Mapbox Classic, Mapbox Styles, Map Warper, or StraboSpot MyMaps?
- [ ] Change the transparency of an overlayed basemap (Home Menu > MAPS > Custom Maps)

#### Offline Basemaps [est. 2 min]
- [ ] View offline basemaps (Home Menu > MAPS > Manage Offline Maps)
- [ ] Able to delete offline basemaps (one or all)?
- [ ] Turn device to airplane mode (to simulate working offline) open maps previously saved

#### Strat Sections [est. 1 min]
- [ ] View stratigraphy sections in the dataset (Home Menu > MAPS > Strat Sections)  

***
### Spots Page [est. 3 min]
- [ ] Open Spots Page from home menu
- [ ] Add a spot. Does the form to add information open correctly?
- [ ] Rename a spot
- [ ] Do all the buttons in the Spot's page work correctly (i.e. does the maps button take you to a map or camera open the camera)?
- [ ] Open and add pages from "More" button? (may need to turn on "Testing Mode" form Miscellaneous Menu for some pages)
- [ ] Open additional pages (i.e. Orientations, Images, Nesting, etc.) from the Spot Page in the Notebook Panel. Do the pages function?
- [ ] Add information to a new page within your spot. Click 'Return to Overview' - does the newly added information save to the active spot? 
- [ ] Check the list of all spots (Home Menu > ATTRIBUTES > Spots). Are all spots visible and accurate? 
- [ ] Filter the spot list using the top views and the filter line button on the top right of the home menu pane
- [ ] Open a spot, click 3 dot button in top right corner of spot page (Notebook Panel). Copy a spot. Delete the newly copied spot. 
  
***
### Images [est. 3 min]
- [ ] Open a spot, click the camera page on the notebook panel: take an image (Take), add a image from your device (Import), create a sketch (Sketch)
- [ ] Add an image description for an image through image properties button (i)
- [ ] Add a sketch on an image
- [ ] Turn an image into a basemap using the toggle below the image in the Notebook Panel
- [ ] All buttons on Images Page function correctly?
- [ ] Able to delete/save an image through the image properties button (i)?
#### Images Page (Home Menu > ATTRIBUTES > Image Gallery)
 - [ ] Do photos taken or uploaded in spot appear? 
 - [ ] Select an image and go to corresponding spot
 - [ ] Add additional images (Take new image or select from file)

***
### Primary Features [est. time will vary depending on amount tested]
**High priority**, _In testing mode_

- **Geologic Units**
   - [ ] Open Home Menu > ATTRIBUTES > Geologic Units: are all geologic units visible?
   - [ ] Create a new geologic unit
   - [ ] Add a spot to the new geologic unit. Go back to the main geologic units page, are the number of spots associated with geologic units in the menu visible?
   - [ ] Change the unit color of a geologic unit (top right of menu panel) 
 - **Notes**
   - [ ] Add notes to a spot and 'Return to Overview'
   - [ ] Open note, edit and 'Return to Overview'
   - [ ] Open note, delete all text and 'Return to Overview'
   - [ ] Create a note template. Edit and delete the note template
 - **Measurements**
   - [ ] Linear Measurement: add, edit, delete? Input manually or measure on device? 
   - [ ] Planar Measurement: add, edit, delete? Input manually or measure on device? 
   - [ ] Linear and Planar Measurement: add, edit, delete? Input manually or measure on device? 
   - [ ] Ability to create measurement templates? Edit and delete? 
 - **Samples (Home Menu > ATTRIBUTES > Samples)**
   - [ ] Do samples collected within Spots display?
   - [ ] Does selecting a sample go to the corresponding spot?
   - [ ] Does deleting the sample remove it?
 - **Samples (within Spot)**
   - [ ] Ability to add new sample?
   - [ ] Ability to edit sample metadata?
   - [ ] Ability to delete sample? 
 - **Tags (Home Menu > ATTRIBUTES > Tags)**
   - [ ] Ability to add tags? Edit and delete tags? 
 - [ ] **3D Structures (add, edit, delete)**
 - [ ] **Other Features (add, edit, delete)**
 - [ ] **Data (add, edit, delete)** 
 - [ ] Site Safety Summary (add, edit, delete)
 - [ ] _Tephra Layers (add, edit, delete)_
 - [ ] _Earthquakes (add, edit, delete)_

 - [ ] Alteration, Ore Rocks (add, edit, delete)
 - [ ] Fault and Shear Zone Rocks (add, edit, delete)
 - [ ] **Igneous Rocks (add, edit, delete)**
 - [ ] **Sedimentary Rocks (add, edit, delete)**
 - [ ] **Metamorphic Rocks (add, edit, delete)**
 - [ ] Minerals (add, edit, delete)
 - [ ] _Reaction Textures (add, edit, delete)_
 - [ ] _Ternary (add, edit, delete)_

 - [ ] **Strat Section (add, edit, delete)**
 - [ ] Lithologies (add, edit, delete)
 - [ ] Bedding (add, edit, delete)
 - [ ] Structures (add, edit, delete)
 - [ ] Diagenesis (add, edit, delete)
 - [ ] Fossils (add, edit, delete)
