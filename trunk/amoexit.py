import re
global xpidata

if item.filename == "chrome/content/gpchangemon.jsm":
  f = file("chrome/content/gpnullmon.jsm")
  xpidata = f.read()
  f.close()
elif item.filename == "chrome/content/gpnullmon.jsm":
  xpidata = None
elif item.filename == "chrome/content/gpcmdatabase.jsm":
  xpidata = None
elif item.filename == "chrome/resource/changemon/changemon.sql":
  xpidata = None
elif item.filename == "chrome/resource/changemon/cmviews.sql":
  xpidata = None
elif item.filename == "chrome.manifest":
  amo_r = re.compile(r"\s*resource\s+gpchangemon.*?\n", re.S) # 2.6 compat
  xpidata = amo_r.sub("\n", xpidata)

if xpidata is not None:
  amo_r = re.compile(r"\s//\s*<ChangeMonitor>(.|\n)+?</ChangeMonitor>", re.S)
  xpidata = amo_r.sub("\n", xpidata)
