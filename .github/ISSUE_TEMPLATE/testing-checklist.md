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
  - Form Checks - Entering data, reading the warnings a form gives, and saving it
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
### Forms and Validation [est. 5 min]
_**Forms warn about a value outside its allowed range as soon as it is typed, and keep the Save button greyed out until every warning is gone. Check that a good value always saves and a bad one never does.**_

#### Value Ranges
- [ ] Open a spot > Measurements > Take a Measurement. Set the toggle at the top to Manual. Enter a Strike of 400
- [ ] Does the warning appear under the Strike field as soon as you type it, without tapping anywhere else first?
- [ ] Is the Save button greyed out while that warning is showing?
- [ ] Change the Strike to 40. Does the warning clear and the Save button come back?
- [ ] Save the measurement. Does it save without an error pop-up, and appear in the notebook?
- [ ] On the same form, enter a Planar Feature Thickness of 0.5. Can you type the decimal point and the digits after it normally?
- [ ] Try an out-of-range value on a few other forms and check the warning and the greyed-out Save the same way: 3D Structures (Trend 0-360, Plunge 0-90), Image properties (View azimuth 0-360), Minerals (Modal %, over 0 and up to 100), Strat Section > Add Interval (Interval Thickness, over 0), Geologic Units (Absolute Age, over 0), Start a New Project (Magnetic Declination, -180 to 180)

#### Required Fields
- [ ] Strat Section > Add Interval: with Interval Thickness, Thickness Units or Type of Interval still empty, is Save greyed out? Does filling all three in turn it back on?
- [ ] Create a new Geologic Unit (Home Menu > ATTRIBUTES > Geologic Units): is Save greyed out until both Name and Unit Label are entered?
- [ ] Home Menu > Manage: My StraboSpot > Start a New Project: is Save New Project greyed out until a project name is entered?
- [ ] _Tephra Layers: is Save greyed out until a Layer Type is chosen?_
- [ ] Site Safety (a Spot's supplemental pages): is Save greyed out until Site Summary Author is filled in, and does the label carry a red asterisk?
- [ ] Earthquake Feature (Geomorphic > Earthquake): is Save greyed out until a feature is chosen?
- [ ] Other Features > open or add a feature: is Save greyed out until both Name and Feature Type are filled in?
- [ ] Strat Section > Add Image Overlay: enter an Image Opacity of 5. Does the warning appear and Save grey out until it is between 0 and 1?
- [ ] Geography (a Spot's Geography page): enter a Latitude of 100 or a Longitude of 200. Does the warning appear and Save grey out? With Display Coordinates as UTM on, try a Zone of `99Z` as well.
- [ ] Samples: choose a Material Type of Other and leave the text box empty. Is Save greyed out until it is filled in? Same for Sampling Purpose > Other.
- [ ] Samples: fill in a sample normally and save it. Does it still save, with the name, notes and every choice you made intact? _This form never ran survey validation before, so check a saved sample carefully._

#### Saving Then Leaving
_**Pressing Save must not be followed by an 'Unsaved Changes' prompt. Leaving without saving still must ask.**_

- [ ] Strat Section > open an interval > Interval: change something, press Save. Does the page leave without asking to save again?
- [ ] Same page: change something and press the back button instead. Does it still ask, and does Yes save it?
- [ ] Save then immediately go back in and check the value stuck.
- [ ] The same two checks on: Bedding, Site Safety, Outcrop Summary, Notes, Other Features, Measurement Detail, and any feature detail page (tephra, fabrics, 3D structures).
- [ ] Bedding: with unsaved general bedding data, press Add Bed. It asks to save; answer Yes. Press Add Bed again — does it stay quiet the second time?
- [ ] Enter a bad value, press Save (it should refuse), then leave the page. Does it still ask about the unsaved change?
- [ ] A legacy sample (one that is not yet a rich sample): open it, type into a field, do NOT save, then press Add Data to Sample. Does it convert with no save prompt, and is your typed value in the new rich sample?
- [ ] The same conversion on an untouched sample: does it still convert normally?
- [ ] The same conversion with an invalid value typed in: does it refuse and explain, leaving the sample unconverted so the field can be fixed?
- [ ] _Web only:_ watch the Saving changes toast through a conversion. It should clear on its own.

#### Forms That Save As You Type
- [ ] Preferences > Naming Conventions: enter a negative Starting Number, or one beginning with a decimal point. Does the warning appear under the field, and does the number stay out of the project?
- [ ] Correct it to a whole number and check the warning clears. The value is saved as you type - reopen the page and confirm it stuck.
- [ ] Change a few fields and toggles, then leave the page. Does a single 'Naming Conventions Saved' message appear on the way out, rather than one per field?
- [ ] Leave the page without changing anything. There should be no message at all.
- [ ] Active Project > Technical Details (project description): change a couple of fields and leave. One 'Project Description Saved' message, and the values are still there when you return.
- [ ] Same page: put an out-of-range magnetic declination in and leave. The warning shows under the field while you type, and leaving alerts about it instead of announcing a save.
- [ ] Same page: set an End Date earlier than the Start Date. The date you picked shows in the field, both dates are flagged reading 'Start Date must come before End Date', and leaving the page reports the error rather than saving. Then fix it from the Start Date side and check both warnings clear.
- [ ] Do that date check on Android, on iOS and on web - the three used to behave differently, and only one of them stopped the save.
- [ ] Privacy Settings: toggle public/private and leave. One 'Privacy Settings Saved' message, and the setting holds.

#### A Value That Was Already Wrong
- [ ] Open a measurement (or any feature) saved earlier with a value outside its range - a dip over 90, say. The field is marked, but can you still edit and save something else on that record, with a message naming the bad field?
- [ ] On the same record, type a NEW bad value into another field and press Save. That one should refuse the whole save and tell you to fix it, rather than quietly dropping what you typed.
- [ ] Type a bad value, then leave the page with Cancel or Back and answer Yes to saving. The bad field keeps the value it had before - the bad one is never stored - and your other edits on that record are kept. Reopen the record to confirm both.

#### What The App Says After A Save
- [ ] Home Menu > Preferences > User Conventions: put a bad value in Measurement Convention, change nothing else, then leave the page. The message names that field and does NOT claim your other changes were saved, and no 'Changes Saved' toast appears behind it. The convention keeps the value it had.
- [ ] Do the same but change another field on the page as well. Now the message should also say your other changes were saved, and that other change should still be there when you return.
- [ ] Do the same but toggle 'Default to Manual Measurement Entry' instead of editing another field. The toggle must stay toggled when you return, and (if you are online and signed in) must reach the server - open the app on another device or reload the profile to confirm it was uploaded, not just kept on this device.

#### Required Fields Marked On The Label
- [ ] A field that must be answered shows a red asterisk after its label. Check one that is always required (Image Type on image properties, Name on a new Geologic Unit) and one that only becomes required after a choice: Take a Measurement > Linear > Linear Feature Type > 'Vorticity axis'. Does Vorticity Type appear with an asterisk?
- [ ] Leave that Vorticity Type unanswered. Does it also say 'Required' in red under the choices, and is Save greyed out until you answer it?
- [ ] Add a 3D Structure > Other. The Feature Type button should carry the asterisk, and 'Required' under it until a type is chosen.
- [ ] Strat Section > open an interval > Lithology Detail: choose a Primary Lithology of Siliciclastic. Does Siliciclastic Type appear with an asterisk and 'Required', with Save greyed out until it is answered?
- [ ] Same lithology, on the Texture tab: is the grain size for the type you chose marked required there (Sandstone Grain Size for sandstone, Conglomerate Grain Size for conglomerate, and so on)?
- [ ] Save is greyed out on every tab of that lithology until it is complete, not just the tab the missing field is on. With Siliciclastic Type still empty, is Save greyed on the Texture tab too?
- [ ] The same lithology on an ordinary spot (not an interval on a strat section) must NOT require any of those - it saves with Primary Lithology alone.

#### Fields That Depend On Other Fields
- [ ] On a bedding or interval form, type a thickness so its Units field appears, then clear the thickness. Does the Units field disappear again straight away?
- [ ] Geologic Units: fill in an Absolute Age, then clear it. Do the Minimum and Maximum Age fields come back?
- [ ] Change a choice that hides other fields (e.g. a lithology or a feature type), save, and reopen. Are the hidden fields' old values gone rather than saved with the feature?

#### Copying Data From Another Spot
- [ ] Minerals page: use 'Copy Minerals Data From' to copy from another spot. Are the minerals copied exactly once, with no duplicates?
- [ ] Igneous, Sedimentary or Metamorphic Rocks: use 'Copy ... Data From'. If you are asked to confirm an overwrite, answer once - the question must not come back on its own
- [ ] Strat Section > Add Interval: choose 'Copy Interval Data From', then type an Interval Name. Do the copied values stay put while you type?
- [ ] Tags: does the Tag Type list at the top of the Tags menu still filter the tags below it?
- [ ] Home > Manage: Upload and Backup: does changing 'Auto-Save to Device Frequency' still stick after leaving and returning?

#### Saving On Web
- [ ] Edit a spot from the notebook panel on web (a measurement, a note, an image title). Does it report 'Changes saved.'? A save that reached the server must not be reported as a failure.
- [ ] Watch the browser console during that save. A line beginning 'Response from ... arrived behind this' means the server printed a warning ahead of its data - the save still worked, but the warning is worth passing to the StraboSpot server team.
- [ ] With the network throttled or offline, edit a spot on web. The failure should say what went wrong and leave you on the page - it must not claim an authentication error or send you back to strabospot.org.

#### Saving
- [ ] Add, edit and save on several different forms (measurements, samples, notes, rock types, tags, daily notes, geography, site safety, project description, user profile). Does each still save, and does the new data show in the notebook?
- [ ] When a form does refuse to save, does the message name the fields in plain language (e.g. 'Interval Thickness') rather than in code (e.g. 'interval_thickness')?
- [ ] Preferences > Naming Conventions: set a spot prefix and a starting number, then add two spots. Are they numbered in sequence?
- [ ] Active Project > Technical Details: enter a magnetic declination with a decimal (e.g. 12.5), leave the page and come back. Is it still 12.5?
- [ ] Spot > Geography: edit the latitude and longitude and save. Does the spot move to the new position on the map (and not to the middle of nowhere)?
- [ ] Spot > Geography with UTM display on (Home Menu > Preferences): edit the easting and northing and save. Does the spot land where those coordinates say?
- [ ] Strat Section > image overlay: set an image height, width and opacity, save, and reopen the overlay. Are the values still there and the overlay drawn at that size?

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
