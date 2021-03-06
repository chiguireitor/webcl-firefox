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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");

var CLASSNAME =  "WebCLKernel";
var CID =        "{5d1be1d7-aad2-4eb3-918b-e9551079d634}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLKernel;1";


function Kernel ()
{
  if (!(this instanceof Kernel)) return new Kernel ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLKernel,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


Kernel.prototype = Object.create (Base.prototype);


Kernel.prototype.classDescription = CLASSNAME;
Kernel.prototype.classID =          Components.ID(CID);
Kernel.prototype.contractID =       CONTRACTID;
Kernel.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLKernel,
                                                             Ci.nsISecurityCheckedComponent,
                                                             Ci.nsISupportsWeakReference,
                                                             Ci.nsIClassInfo
                                                           ]);


//------------------------------------------------------------------------------
// IWebCLKernel

// getInfo(KERNEL_CONTEXT)._owner == this._owner._owner == [WebCL]
// getInfo(KERNEL_PROGRAM)._owner == this._owner == [WebCLContext]
//
Kernel.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLKernel.getInfo");

    switch (name)
    {
    case ocl_info.CL_KERNEL_FUNCTION_NAME:
    case ocl_info.CL_KERNEL_NUM_ARGS:
      return this._internal.getInfo (name);

    case ocl_info.CL_KERNEL_CONTEXT:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem, this._owner._owner);

    case ocl_info.CL_KERNEL_PROGRAM:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem, this._owner);

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLKernel.getInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.getWorkGroupInfo = function (device, name)
{
  TRACE (this, "getWorkGroupInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLKernel.getWorkGroupInfo");

    switch (name)
    {
    case ocl_info.CL_KERNEL_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_COMPILE_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_LOCAL_MEM_SIZE:
    case ocl_info.CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE:
    case ocl_info.CL_KERNEL_PRIVATE_MEM_SIZE:
      var clDevice = this._unwrapInternalOrNull (device);
      var clInfoItem = this._internal.getWorkGroupInfo (clDevice, name);
      return clInfoItem;

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLKernel.getWorkGroupInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.getArgInfo = function ()
{
  TRACE (this, "getArgInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    throw new Exception ("NOT IMPLEMENTED");
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.setArg = function (index, value)
{
  TRACE (this, "setArg", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // Handle arguments with local address space qualifier.
    // The number of bytes allocated is set using Uint32Array of length 1.
    // As we don't have getArgInfo we'll just test any such argument by treating
    // them initially as local arg and hope that CL driver fails that if they
    // weren't.
    try {
      if (value && typeof(value) == "object")
      {
        let re = /\[object (\w*)\]/.exec(Object.prototype.toString.call(value));
        if (re && re[1] && re[1] == "Uint32Array" && value.length == 1)
        {
          DEBUG ("Kernel.setArg: Possible local arg detected, index="+index+" size="+value[0]+".");
          this._internal.setArg (+index, +(value[0]));

          // setArg didn't fail so arg seems to have been local.
          return;
        }
      }
    } catch(e) {}

    this._internal.setArg (+index, this._unwrapInternal (value));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


Kernel.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal && !this._invalid)
    {
      return this._internal.getInfo (ocl_info.CL_KERNEL_REFERENCE_COUNT);
    }
    else
    {
      return 0;
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Kernel]);


} catch(e) { ERROR ("webclkernel.js: "+EXCEPTIONSTR(e)); }
