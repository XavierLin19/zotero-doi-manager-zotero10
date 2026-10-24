// Zotero 10 compatibility fork of DOI Manager 1.5.0 (MPL-2.0).
// Zotero provides Services in the bootstrap sandbox. Do not import Services.jsm.
var ShortDOI;
var chromeHandle;
function log(msg) { Zotero.debug('DOI Manager: ' + msg); }
async function install() { await Zotero.initializationPromise; }
async function startup({id, version, rootURI}) {
    await Zotero.initializationPromise;
    var aomStartup = Cc['@mozilla.org/addons/addon-manager-startup;1']
        .getService(Ci.amIAddonManagerStartup);
    chromeHandle = aomStartup.registerChrome(Services.io.newURI(rootURI + 'manifest.json'), [
        ['locale', 'zoteroshortdoi', 'en-US', 'locale/en-US/'],
        ['locale', 'zoteroshortdoi', 'de', 'locale/de/']
    ]);
    Services.scriptloader.loadSubScript(rootURI + 'zoteroshortdoi.js');
    ShortDOI.init({id, version, rootURI});
    await Zotero.PreferencePanes.register({
        pluginID: id,
        src: rootURI + 'content/options.xhtml'
    });
    ShortDOI.addToAllWindows();
    log('Started ' + version);
}
function onMainWindowLoad({window}) { if (ShortDOI) ShortDOI.addToWindow(window); }
function onMainWindowUnload({window}) { if (ShortDOI) ShortDOI.removeFromWindow(window); }
function shutdown() {
    if (ShortDOI) {
        Zotero.Notifier.unregisterObserver(ShortDOI.notifierID);
        ShortDOI.removeFromAllWindows();
        if (ShortDOI.progressWindow) ShortDOI.progressWindow.close();
        ShortDOI = undefined;
    }
    if (chromeHandle) { chromeHandle.destruct(); chromeHandle = null; }
}
function uninstall() {}
