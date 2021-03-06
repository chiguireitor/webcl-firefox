/*
 * This file is part of WebCL – Web Computing Language.
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 *
 * The Original Contributor of this Source Code Form is
 * Nokia Research Center Tampere (http://webcl.nokiaresearch.com).
 *
 */


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://nrcwebcl/modules/common.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://nrcwebcl/modules/logger.jsm");
Cu.import("resource://nrcwebcl/modules/webclutils.jsm");

Cu.import("resource://gre/modules/Services.jsm");


var CLASSNAME =  "WebCLLoader";
var CID =        "{f2e0f66e-615a-4b86-b0ea-2fd3c8729ac2}";
var CONTRACTID = "@webcl.nokiaresearch.com/WebCLLoader;1";


INFO ("WebCL Loader, Nokia Research Center, 2013");



function WebCLLoader ()
{
  this.wrappedJSObject = this;

  INFO ("ABI: " + getRuntimeABI ());
  INFO ("OS_TARGET: " + getRuntimeOS ());

  this._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
  webclutils.setPrefObserver_allowed (this);
}


WebCLLoader.prototype = {
  classDescription: CLASSNAME,
  classID:          Components.ID(CID),
  contractID:       CONTRACTID,

  QueryInterface: XPCOMUtils.generateQI ([ Ci.nsIObserver,
                                           Ci.nsISupportsWeakReference
                                         ])
};


function handle_profileAfterChange (ctx)
{
  var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  os.addObserver(ctx, "content-document-global-created", false);
}


function handle_contentDocumentGlobalCreated (ctx, domWindow)
{
  // Don't load WebCL Wrapper if we are on about: or chrome page.
  // TODO: Any other bad schemes? Should we limit to only http: and maybe file: ?

  if (domWindow.document.baseURI.startsWith("about:")) return;
  if (domWindow.document.baseURI.startsWith("chrome:")) return;

  // Is WebCL enabled?
  if (ctx._allowed !== 0)
  {
    LOG ("Loading WebCL client side component. baseURI: " + domWindow.document.baseURI);
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                            .getService (Ci.mozIJSSubScriptLoader);
    loader.loadSubScript ("chrome://nrcwebcl/content/webclclientwrapper.js",
                          domWindow.wrappedJSObject);

    try
    {
      if (Services.prefs.getCharPref ("extensions.webcl.api-mode") == "deprecated-1.0.3")
      {
        LOG ("Loading deprecated compatibilitity API.");
        loader.loadSubScript ("chrome://nrcwebcl/content/webcldeprecatedclientwrapper.js",
                              domWindow.wrappedJSObject);
      }
    }
    catch (e) { }

    // Another option? https://developer.mozilla.org/en-US/docs/Components.utils.createObjectIn
  }
}


function handle_prefChanged (ctx, name)
{
  switch (name)
  {
    case webclutils.PREF_WEBCL_ALLOWED:
      ctx._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
      break;
  }
}


WebCLLoader.prototype.observe = function (subject, topic, data)
{
  LOG ("WebCLLoader#observe: topic=" + topic + ", data=" + data);

  switch (topic) {
    case "profile-after-change":
      handle_profileAfterChange (this);
      break;

    case "content-document-global-created":
      handle_contentDocumentGlobalCreated (this, subject);
      break;

    case "nsPref:changed":
      handle_prefChanged (this, data);
      break;
  }
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCLLoader]);
