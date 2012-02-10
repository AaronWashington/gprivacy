import re
global xpidata

if item.filename == "chrome/content/gpchangemon.jsm":
  f = file("chrome/content/gpnullmon.jsm")
  xpidata = f.read()
  f.close()
elif item.filename in [
  "chrome/content/gpnullmon.jsm",
  "chrome/content/gpcmdatabase.jsm",
  "chrome/resource/changemon/changemon.sql",
  "chrome/resource/changemon/cmviews.sql",
  "chrome/resource/changemon/",
  "changelog.txt",
  ]:
  xpidata = None
elif item.filename == "chrome.manifest":
  amo_r = re.compile(r"\s*resource\s+gpchangemon.*?\n", re.S) # 2.6 compat
  xpidata = amo_r.sub("\n", xpidata)

if xpidata is not None:
  amo_r = re.compile(r"\s//\s*<ChangeMonitor>(.|\n)+?</ChangeMonitor>", re.S)
  xpidata = amo_r.sub("\n", xpidata)
