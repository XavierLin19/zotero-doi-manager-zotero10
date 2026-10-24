// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}

var _is7 = Zotero.platformMajorVersion >= 102;

function _create(doc, name) {
    const elt = _is7 ? doc.createXULElement(name) : doc.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', name)
    return elt
}

ShortDOI = {
    id: null,
    version: null,
    rootURI: null,
    addedElementIDs: [],
    notifierID: null,
    
    log(msg) {
        Zotero.debug("Make It Red: " + msg);
    },
    
    // Preference managers

    getPref(pref) {
        return Zotero.Prefs.get('extensions.shortdoi.' + pref, true);
    },

    setPref(pref, value) {
        return Zotero.Prefs.set('extensions.shortdoi.' + pref, value, true);
    },
    
    // Startup - initialize plugin

    init({ id, version, rootURI } = {}) {
        ShortDOI.resetState("initial");
        
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;

        // Register the callback in Zotero as an item observer
        this.notifierID = Zotero.Notifier.registerObserver(
            ShortDOI.notifierCallback, ['item']);
    },
    
    // Overlay management
    
    addToWindow(window) {
        let doc = window.document;
        if (doc.getElementById("zotero-itemmenu-shortdoi-menu")) return;
        
        // createElementNS() necessary in Zotero 6; createElement() defaults to HTML in Zotero 7
        //let HTML_NS = "http://www.w3.org/1999/xhtml";
        //let XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        
        let stringBundle = Services.strings.createBundle(
        'chrome://zoteroshortdoi/locale/zoteroshortdoi.properties'
        );
        
        // Item menu
        let itemmenu = _create(doc, 'menu');
        itemmenu.id = 'zotero-itemmenu-shortdoi-menu';
        itemmenu.setAttribute('class', 'menu-iconic');
        //itemmenu.setAttribute('image', 'xxx');
        itemmenu.setAttribute('label', stringBundle.GetStringFromName('shortdoi-menu-label'));
        
        let itemmenupopup = _create(doc, 'menupopup');
        itemmenupopup.id = 'zotero-itemmenu-shortdoi-menupopup';
        
        let updateShort = _create(doc, 'menuitem');
        updateShort.id = 'zotero-itemmenu-shortdoi-short';
        updateShort.setAttribute('label', stringBundle.GetStringFromName('shortdoi-menu-short-label'));
        updateShort.addEventListener('command', () => {
            ShortDOI.updateSelectedItems('short');
        });
        
        let updateLong = _create(doc, 'menuitem');
        updateLong.id = 'zotero-itemmenu-shortdoi-long';
        updateLong.setAttribute('label', stringBundle.GetStringFromName('shortdoi-menu-long-label'));
        updateLong.addEventListener('command', () => {
            ShortDOI.updateSelectedItems('long');
        });
        
        let updateCheck = _create(doc, 'menuitem');
        updateCheck.id = 'zotero-itemmenu-shortdoi-check';
        updateCheck.setAttribute('label', stringBundle.GetStringFromName('shortdoi-menu-check-label'));
        updateCheck.addEventListener('command', () => {
            ShortDOI.updateSelectedItems('check');
        });
        
        itemmenupopup.appendChild(updateShort);
        itemmenupopup.appendChild(updateLong);
        itemmenupopup.appendChild(updateCheck);
        itemmenu.appendChild(itemmenupopup);
        doc.getElementById('zotero-itemmenu').appendChild(itemmenu);
        this.storeAddedElement(itemmenu);
        
        // Tools menu
        // Preferences
        // As they are now in the main Zotero preferences in Zotero 7, this is only for Zotero 6
        if (!_is7) {
            let menuitem = _create(doc, 'menuitem');
            menuitem.id = 'menu_Tools-shortdoi-preferences';
            menuitem.setAttribute('label', stringBundle.GetStringFromName('shortdoi-preferences-label'));
            menuitem.addEventListener('command', () => {
                ShortDOI.openPreferenceWindow();
            });
            doc.getElementById('menu_ToolsPopup').appendChild(menuitem);
            this.storeAddedElement(menuitem);
        }
        
        // Auto-retrieve settings
        let submenu = _create(doc, 'menu');
        submenu.id = 'menu_Tools-shortdoi-menu';
        submenu.setAttribute('label', stringBundle.GetStringFromName('shortdoi-autoretrieve-label'));
        let submenupopup = _create(doc, 'menupopup');
        submenupopup.id = 'menu_Tools-shortdoi-menu-popup';
        submenupopup.addEventListener('popupshowing', () => {
            ShortDOI.setCheck();
        });
            
        let itemShort = _create(doc, 'menuitem');
        itemShort.id = 'menu_Tools-shortdoi-menu-popup-short';
        itemShort.setAttribute('type', 'checkbox');
        itemShort.setAttribute('label', stringBundle.GetStringFromName('shortdoi-autoretrieve-short-label'));
        itemShort.addEventListener('command', () => {
            ShortDOI.changePref('short');
        });
        
        let itemLong = _create(doc, 'menuitem');
        itemLong.id = 'menu_Tools-shortdoi-menu-popup-long';
        itemLong.setAttribute('type', 'checkbox');
        itemLong.setAttribute('label', stringBundle.GetStringFromName('shortdoi-autoretrieve-long-label'));
        itemLong.addEventListener('command', () => {
            ShortDOI.changePref('long');
        });
        
        let itemCheck = _create(doc, 'menuitem');
        itemCheck.id = 'menu_Tools-shortdoi-menu-popup-check';
        itemCheck.setAttribute('type', 'checkbox');
        itemCheck.setAttribute('label', stringBundle.GetStringFromName('shortdoi-autoretrieve-check-label'));
        itemCheck.addEventListener('command', () => {
            ShortDOI.changePref('check');
        });
        
        let itemNone = _create(doc, 'menuitem');
        itemNone.id = 'menu_Tools-shortdoi-menu-popup-none';
        itemNone.setAttribute('type', 'checkbox');
        itemNone.setAttribute('label', stringBundle.GetStringFromName('shortdoi-autoretrieve-no-label'));
        itemNone.addEventListener('command', () => {
            ShortDOI.changePref('none');
        });
        
        submenupopup.appendChild(itemShort);
        submenupopup.appendChild(itemLong);
        submenupopup.appendChild(itemCheck);
        submenupopup.appendChild(itemNone);
        submenu.appendChild(submenupopup);
        doc.getElementById('menu_ToolsPopup').appendChild(submenu);
        this.storeAddedElement(submenu);
        
        // Use strings from make-it-red.ftl (Fluent) in Zotero 7
        /*if (is7) {
         window.MozXULElement.insertFTLIfNeeded("zoteroshortdoi.ftl");
         }
         // Use strings from make-it-red.properties (legacy properties format) in Zotero 6
         else {
         let stringBundle = Services.strings.createBundle(
         'chrome://zotero-shortdoi/locale/zoteroshortdoi.properties'
         );
         doc.getElementById('menu_Tools-shortdoi-preferences')
         .setAttribute('label', stringBundle.GetStringFromName('makeItGreenInstead.label'));
         }*/
    },
    
    addToAllWindows() {
            var windows = Zotero.getMainWindows();
            for (let win of windows) {
                if (!win.ZoteroPane) continue;
                this.addToWindow(win);
            }
        },
    
    removeFromWindow(window) {
        for (let id of new Set(this.addedElementIDs)) {
            window.document.getElementById(id)?.remove();
        }
    },

    removeFromAllWindows() {
        for (let win of Zotero.getMainWindows()) this.removeFromWindow(win);
        this.addedElementIDs = [];
    },

    storeAddedElement(elem) {
        if (!elem.id) {
            throw new Error("Element must have an id");
        }
        this.addedElementIDs.push(elem.id);
    },
    
    // Notifications
    
    notifierCallback: {
        notify: function(event, type, ids, extraData) {
            if (event == 'add') {
              switch (ShortDOI.getPref("autoretrieve")) {
                case "short":
                  ShortDOI.updateItems(Zotero.Items.get(ids), "short");
                  break;
                case "long":
                  ShortDOI.updateItems(Zotero.Items.get(ids), "long");
                  break;
                case "verify":
                case "check":
                  ShortDOI.updateItems(Zotero.Items.get(ids), "check");
                  break;
                default:
                  break;
              }
            }
        }
    },
    
    // Controls for Tools menu

    // *********** Set the checkbox checks, frompref
    setCheck() {
        let document = Zotero.getMainWindow().document;
        
        var tools_short = document.getElementById("menu_Tools-shortdoi-menu-popup-short");
        var tools_long  = document.getElementById("menu_Tools-shortdoi-menu-popup-long");
        var tools_check = document.getElementById("menu_Tools-shortdoi-menu-popup-check");
        var tools_none  = document.getElementById("menu_Tools-shortdoi-menu-popup-none");
        var pref = ShortDOI.getPref("autoretrieve");
        tools_short.setAttribute("checked", Boolean(pref === "short"));
        tools_long.setAttribute("checked", Boolean(pref === "long"));
        tools_check.setAttribute("checked", Boolean(pref === "check" || pref === "verify"));
        tools_none.setAttribute("checked", Boolean(pref === "none"));
    },

    // *********** Change the checkbox, topref
    changePref(option) {
        ShortDOI.setPref("autoretrieve", option);
    },
    
    /**
     * Open shortdoi preference window
     */
    openPreferenceWindow(paneID, action) {
        log("Opening pref window for DOI");
        
        let window = Zotero.getMainWindow();
        var io = {pane: paneID, action: action};
        window.openDialog('chrome://zoteroshortdoi/content/options.xul',
                          'shortdoi-pref',
                          'chrome,titlebar,toolbar,centerscreen' + Zotero.Prefs.get('browser.preferences.instantApply', true) ? 'dialog=no' : 'modal', io
                          );
    },
    
    resetState(operation) {

        if (operation == "initial") {
            if (ShortDOI.progressWindow) {
                ShortDOI.progressWindow.close();
            }
            ShortDOI.current = -1;
            ShortDOI.toUpdate = 0;
            ShortDOI.itemsToUpdate = null;
            ShortDOI.numberOfUpdatedItems = 0;
            ShortDOI.counter = 0;
            error_invalid = null;
            error_nodoi = null;
            error_multiple = null;
            error_invalid_shown = false;
            error_nodoi_shown = false;
            error_multiple_shown = false;
            final_count_shown = false;
            return;
        } else {
            if(error_invalid || error_nodoi || error_multiple) {
                ShortDOI.progressWindow.close();
                var icon = "chrome://zotero/skin/cross.png";
                if(error_invalid && ! error_invalid_shown) {
                  var progressWindowInvalid = new Zotero.ProgressWindow({closeOnClick:true});
                  progressWindowInvalid.changeHeadline("Invalid DOI");
                  if(ShortDOI.getPref("tag_invalid") !== "") {
                    progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid DOIs were found. These have been tagged with '" + ShortDOI.getPref("tag_invalid") + "'.");
                  } else {
                    progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid DOIs were found.");
                  }
                  progressWindowInvalid.progress.setError();
                  progressWindowInvalid.show();
                  progressWindowInvalid.startCloseTimer(8000);
                  error_invalid_shown = true;
                }
                if(error_nodoi && ! error_nodoi_shown) {
                  var progressWindowNoDOI = new Zotero.ProgressWindow({closeOnClick:true});
                  progressWindowNoDOI.changeHeadline("DOI not found");
                  if(ShortDOI.getPref("tag_nodoi") !== "") {
                    progressWindowNoDOI.progress = new progressWindowNoDOI.ItemProgress(icon, "No DOI was found for some items. These have been tagged with '" + ShortDOI.getPref("tag_nodoi") + "'.");
                  } else {
                    progressWindowNoDOI.progress = new progressWindowNoDOI.ItemProgress(icon, "No DOI was found for some items.");
                  }
                  progressWindowNoDOI.progress.setError();
                  progressWindowNoDOI.show();
                  progressWindowNoDOI.startCloseTimer(8000);
                  error_nodoi_shown = true;
                }
                if(error_multiple && ! error_multiple_shown) {
                  var progressWindowMulti = new Zotero.ProgressWindow({closeOnClick:true});
                  progressWindowMulti.changeHeadline("Multiple possible DOIs");
                  if(ShortDOI.getPref("tag_multiple") !== "") {
                    progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible DOIs. Links to lists of DOIs have been added and tagged with '" + ShortDOI.getPref("tag_multiple") + "'.");
                  } else {
                    progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible DOIs.");
                  }
                  progressWindow.progress.setError();
                  progressWindowMulti.show();
                  progressWindowMulti.startCloseTimer(8000);
                  error_multiple_shown = true;
                }

            } else {
              if(! final_count_shown) {
                var icon = "chrome://zotero/skin/tick.png";
                ShortDOI.progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
                ShortDOI.progressWindow.changeHeadline("Finished");
                ShortDOI.progressWindow.progress = new ShortDOI.progressWindow.ItemProgress(icon);
                ShortDOI.progressWindow.progress.setProgress(100);
                if (operation == "short") {
                    ShortDOI.progressWindow.progress.setText("shortDOIs updated for "+ShortDOI.counter+" items.");
                } else if (operation == "long") {
                    ShortDOI.progressWindow.progress.setText("Long DOIs updated for "+ShortDOI.counter+" items.");
                } else {
                    ShortDOI.progressWindow.progress.setText("DOIs verified for "+ShortDOI.counter+" items.");
                }
                ShortDOI.progressWindow.show();
                ShortDOI.progressWindow.startCloseTimer(4000);
                final_count_shown = true;
              }
            }
            return;
        }
    },
};


ShortDOI.generateItemUrl = function(item, operation) {
    var doi = item.getField('DOI');
    if (! doi) {
        doi = ShortDOI.crossrefLookup(item, operation);
    } else {

        if (typeof doi === "string") {
            doi = Zotero.Utilities.cleanDOI(doi);
            if (doi) {
                if (operation === "short" && ! doi.match(/10\/[^\s]*[^\s\.,]/)) {
                    var url = 'https://shortdoi.org/' + encodeURIComponent(doi) + '?format=json';
                    return url;

                } else {
                    var url = 'https://doi.org/api/handles/' + encodeURIComponent(doi);
                    return url;
                }

            } else {
                return "invalid";
            }

          } else {
              return "invalid";
          }
    }

    return false;

};

ShortDOI.updateSelectedItems = function(operation) {
    ShortDOI.updateItems(Zotero.getActiveZoteroPane().getSelectedItems(), operation);
};

ShortDOI.updateItems = function(items, operation) {
    // For now, filter out non-journal article and conference paper items
    var items = items.filter(item => item.itemTypeID == Zotero.ItemTypes.getID('journalArticle') || item.itemTypeID == Zotero.ItemTypes.getID('conferencePaper'));
    var items = items.filter(item => ! item.isFeedItem);

    if (items.length === 0 ||
            ShortDOI.numberOfUpdatedItems < ShortDOI.toUpdate) {
        return;
    }

    ShortDOI.resetState("initial");
    ShortDOI.toUpdate = items.length;
    ShortDOI.itemsToUpdate = items;

    // Progress Windows
    ShortDOI.progressWindow = new Zotero.ProgressWindow({closeOnClick: false});
    var icon = 'chrome://zotero/skin/toolbar-advanced-search' + (Zotero.hiDPI ? "@2x" : "") + '.png';
    if (operation == "short") {
        ShortDOI.progressWindow.changeHeadline("Getting shortDOIs", icon);
    } else if (operation == "long") {
        ShortDOI.progressWindow.changeHeadline("Getting long DOIs", icon);
    } else {
        ShortDOI.progressWindow.changeHeadline("Validating DOIs and removing extra text", icon);
    }
    let iconPath = _is7 ? this.rootURI + 'skin/doi' : 'chrome://zoteroshortdoi/skin/doi';
    var doiIcon = iconPath + (Zotero.hiDPI ? "@2x" : "") + '.png';
    ShortDOI.progressWindow.progress = new ShortDOI.progressWindow.ItemProgress(doiIcon, "Checking DOIs.");

    ShortDOI.updateNextItem(operation);
};

ShortDOI.updateNextItem = function(operation) {
    ShortDOI.numberOfUpdatedItems++;

    if (ShortDOI.current == ShortDOI.toUpdate - 1) {
        ShortDOI.progressWindow.close();
        ShortDOI.resetState(operation);
        return;
    }

    ShortDOI.current++;

    // Progress Windows
    var percent = Math.round((ShortDOI.numberOfUpdatedItems/ShortDOI.toUpdate)*100);
    ShortDOI.progressWindow.progress.setProgress(percent);
    ShortDOI.progressWindow.progress.setText("Item "+ShortDOI.current+" of "+ShortDOI.toUpdate);
    ShortDOI.progressWindow.show();

    ShortDOI.updateItem(
            ShortDOI.itemsToUpdate[ShortDOI.current], operation);
};

ShortDOI.updateItem = function(item, operation) {
    var url = ShortDOI.generateItemUrl(item, operation);

    if ( ! url ) {
        if (item.hasTag(ShortDOI.getPref("tag_invalid"))) {
            item.removeTag(ShortDOI.getPref("tag_invalid"));
            item.saveTx();
        }
        ShortDOI.updateNextItem(operation);
    } else if (url == 'invalid') {
        ShortDOI.invalidate(item, operation);
    } else {
        var oldDOI = item.getField('DOI');
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'json';

        if (operation == "short") {

            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (item.isRegularItem() && !item.isCollection()) {
                            if (oldDOI.match(/10\/[^\s]*[^\s\.,]/)) {
                                if (req.response.responseCode == 1) {
                                    if (req.response.handle != oldDOI) {
                                        var shortDOI = req.response.handle.toLowerCase();
                                        item.setField('DOI', shortDOI);
                                        item.removeTag(ShortDOI.getPref("tag_invalid"));
                                        item.removeTag(ShortDOI.getPref("tag_multiple"));
                                        item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                        item.saveTx();
                                        ShortDOI.counter++;
                                    } else if (item.hasTag(ShortDOI.getPref("tag_invalid")) || item.hasTag(ShortDOI.getPref("tag_multiple")) || item.hasTag(ShortDOI.getPref("tag_nodoi"))) {
                                        item.removeTag(ShortDOI.getPref("tag_invalid"));
                                        item.removeTag(ShortDOI.getPref("tag_multiple"));
                                        item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                        item.saveTx();
                                    }
                                } else {
                                    ShortDOI.invalidate(item, operation);
                                }
                            } else {
                                var shortDOI = req.response.ShortDOI.toLowerCase();
                                item.setField('DOI', shortDOI);
                                item.removeTag(ShortDOI.getPref("tag_invalid"));
                                item.removeTag(ShortDOI.getPref("tag_multiple"));
                                item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                item.saveTx();
                                ShortDOI.counter++;
                            }

                        }
                        ShortDOI.updateNextItem(operation);
                    } else if (req.status == 400 || req.status == 404) {
                        ShortDOI.invalidate(item, operation);
                    } else {
                        ShortDOI.updateNextItem(operation);
                    }
                }
            };

            req.send(null);

        } else if (operation == "long") {

            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (req.response.responseCode == 1) {
                            if (oldDOI.match(/10\/[^\s]*[^\s\.,]/)) {

                                if (item.isRegularItem() && !item.isCollection()) {
                                    var longDOI = req.response.values["1"].data.value.toLowerCase();
                                    item.setField('DOI', longDOI);
                                    item.removeTag(ShortDOI.getPref("tag_invalid"));
                                    item.removeTag(ShortDOI.getPref("tag_multiple"));
                                    item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                    item.saveTx();
                                    ShortDOI.counter++;
                                }
                            } else {
                                if (req.response.handle != oldDOI) {
                                    var longDOI = req.response.handle.toLowerCase();
                                    item.setField('DOI', longDOI);
                                    item.removeTag(ShortDOI.getPref("tag_invalid"));
                                    item.removeTag(ShortDOI.getPref("tag_multiple"));
                                    item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                    item.saveTx();
                                    ShortDOI.counter++;
                                } else if (item.hasTag(ShortDOI.getPref("tag_invalid")) || item.hasTag(ShortDOI.getPref("tag_multiple")) || item.hasTag(ShortDOI.getPref("tag_nodoi"))) {
                                    item.removeTag(ShortDOI.getPref("tag_invalid"));
                                    item.removeTag(ShortDOI.getPref("tag_multiple"));
                                    item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                    item.saveTx();
                                }
                            }
                            ShortDOI.updateNextItem(operation);

                        } else {
                            ShortDOI.invalidate(item, operation);
                        }

                    } else if (req.status == 404) {
                        ShortDOI.invalidate(item, operation);

                    } else {
                        ShortDOI.updateNextItem(operation);
                    }
                }
            };

            req.send(null);

        } else { //operation == "check"

            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    if (req.status == 404) {
                        ShortDOI.invalidate(item, operation);
                    } else if (req.status == 200) {
                        if (req.response.responseCode == 200) {
                            ShortDOI.invalidate(item, operation);
                        } else {
                            if (req.response.handle != oldDOI) {
                                var newDOI = req.response.handle.toLowerCase();
                                item.setField('DOI', newDOI);
                                item.removeTag(ShortDOI.getPref("tag_invalid"));
                                item.removeTag(ShortDOI.getPref("tag_multiple"));
                                item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                item.saveTx();
                            } else if (item.hasTag(ShortDOI.getPref("tag_invalid")) || item.hasTag(ShortDOI.getPref("tag_multiple")) || item.hasTag(ShortDOI.getPref("tag_nodoi"))) {
                                item.removeTag(ShortDOI.getPref("tag_invalid"));
                                item.removeTag(ShortDOI.getPref("tag_multiple"));
                                item.removeTag(ShortDOI.getPref("tag_nodoi"));
                                item.saveTx();
                            }
                            ShortDOI.counter++;
                            ShortDOI.updateNextItem(operation);
                        }

                    } else {
                        ShortDOI.updateNextItem(operation);
                    }
                }
            };

            req.send(null);
        }
    }
};

ShortDOI.invalidate = function(item, operation) {
    if (item.isRegularItem() && !item.isCollection()) {
        error_invalid = true;
        if(ShortDOI.getPref("tag_invalid") !== "") item.addTag(ShortDOI.getPref("tag_invalid"), 1);
        item.saveTx();
    }
    ShortDOI.updateNextItem(operation);
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        ShortDOI.init();
    }, false);
}

ShortDOI.crossrefLookup = function(item, operation) {
  var crossrefOpenURL = 'https://www.crossref.org/openurl?pid=zoteroDOI@wiernik.org&';
  var ctx = Zotero.OpenURL.createContextObject(item, "1.0");
  if (ctx) {
      var url = crossrefOpenURL + ctx + '&multihit=true';
      var req = new XMLHttpRequest();
      req.open('GET', url, true);

      req.onreadystatechange = function() {
          if (req.readyState == 4) {
              if (req.status == 200) {
                  var response = req.responseXML.getElementsByTagName("query")[0];
                  var status = response.getAttribute('status')
                  if (status === "resolved") {
                      var doi = response.getElementsByTagName("doi")[0].childNodes[0].nodeValue;
                      if (operation === "short") {
                          item.setField('DOI', doi);
                          ShortDOI.updateItem(item, operation);

                      } else {
                          item.setField('DOI', doi);
                          item.removeTag(ShortDOI.getPref("tag_invalid"));
                          item.removeTag(ShortDOI.getPref("tag_multiple"));
                          item.removeTag(ShortDOI.getPref("tag_nodoi"));
                          item.saveTx();
                          ShortDOI.counter++;
                          ShortDOI.updateNextItem(operation);
                      }


                  } else if (status === "unresolved") {
                      error_nodoi = true;
                      item.removeTag(ShortDOI.getPref("tag_invalid"));
                      item.removeTag(ShortDOI.getPref("tag_multiple"));
                      item.removeTag(ShortDOI.getPref("tag_nodoi"));
                      if(ShortDOI.getPref("tag_nodoi") !== "") item.addTag(ShortDOI.getPref("tag_nodoi"), 1);
                      item.saveTx();
                      ShortDOI.updateNextItem(operation);

                  } else if (status === "multiresolved") {
                      error_multiple = true;
                      Zotero.Attachments.linkFromURL({"url":crossrefOpenURL + ctx, "parentItemID":item.id, "contentType":"text/html", "title":"Multiple DOIs found"});
                      if (item.hasTag(ShortDOI.getPref("tag_invalid")) || item.hasTag(ShortDOI.getPref("tag_nodoi"))) {
                          item.removeTag(ShortDOI.getPref("tag_invalid"));
                          item.removeTag(ShortDOI.getPref("tag_nodoi"));
                      }
                      // TODO: Move this tag to the attachment link
                      if(ShortDOI.getPref("tag_multiple") !== "") item.addTag(ShortDOI.getPref("tag_multiple"), 1);
                      item.saveTx();
                      ShortDOI.updateNextItem(operation);

                  } else {
                      Zotero.debug("Zotero DOI Manager: CrossRef lookup: Unknown status code: " + status);
                      ShortDOI.updateNextItem(operation);
                  }

              } else {
                  ShortDOI.updateNextItem(operation);
              }

          }
      };

      req.send(null);

    }

    return false;

};
