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


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");


var CLASSNAME =  "WebCLPlatform";
var CID =        "{6ab8b8cf-4d87-40a0-af8a-cc0bf5251fa3}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLPlatform;1";


function Platform ()
{
  if (!(this instanceof Platform)) return new Platform ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLPlatform,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


Platform.prototype = Object.create (Base.prototype);


Platform.prototype.classDescription = CLASSNAME;
Platform.prototype.classID =          Components.ID(CID);
Platform.prototype.contractID =       CONTRACTID;
Platform.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLPlatform,
                                                               Ci.nsISecurityCheckedComponent,
                                                               Ci.nsISupportsWeakReference,
                                                               Ci.nsIClassInfo
                                                             ]);


//------------------------------------------------------------------------------
// IWebCLPlatform

Platform.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLPlatform.getInfo");

    switch (name)
    {
      case ocl_info.CL_PLATFORM_PROFILE:                  return "WEBCL_PROFILE";
      case ocl_info.CL_PLATFORM_VERSION:                  return "WebCL 1.0";
      case ocl_info.CL_PLATFORM_NAME:                     break;
      case ocl_info.CL_PLATFORM_VENDOR:                   break;
      case ocl_info.CL_PLATFORM_EXTENSIONS:               break;
      default:
        throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLPlatform.getInfo");
    }

    return this._wrapInternal (this._internal.getInfo (name));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// getDevices()[i]._owner == this._owner == [WebCL]
//
Platform.prototype.getDevices = function (deviceType)
{
  TRACE (this, "getDevices", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(deviceType))
      throw new CLError(ocl_errors.CL_INVALID_DEVICE_TYPE, 
                        "deviceType must be a valid DEVICE_TYPE",
                        "WebCLPlatform.getDevices");

    if (deviceType !== 0 &&
        deviceType !== ocl_const.CL_DEVICE_TYPE_DEFAULT && 
        deviceType !== ocl_const.CL_DEVICE_TYPE_CPU && 
        deviceType !== ocl_const.CL_DEVICE_TYPE_GPU && 
        deviceType !== ocl_const.CL_DEVICE_TYPE_ACCELERATOR && 
        deviceType !== ocl_const.CL_DEVICE_TYPE_ALL)
      throw new CLError(ocl_errors.CL_INVALID_DEVICE_TYPE, 
                        "deviceType must be a valid DEVICE_TYPE",
                        "WebCLPlatform.getDevices");

    return this._wrapInternal (this._internal.getDevices (deviceType || ocl_const.CL_DEVICE_TYPE_ALL));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Platform.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // TODO Platform.getSupportedExtensions
    return [];
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Platform.prototype.enableExtension = function (extensionName)
{
  TRACE (this, "enableExtension", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // TODO Platform.enableExtension
    return false;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};

//------------------------------------------------------------------------------
// Internal functions


Platform.prototype._getRefCount = function ()
{
  // WebCLPlatform doesn't support refcounting.
  return 0;
};



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Platform]);


} catch(e) { ERROR ("webcldevice.js: "+e); }
