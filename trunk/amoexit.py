global xpidata

if item.filename == "chrome/content/gpchangemon.jsm":
  f = file("chrome/content/gpnullmon.jsm")
  xpidata = f.read()
  f.close()
elif item.filename == "chrome/content/gpnullmon.jsm":
  xpidata = ""
elif item.filename == "chrome/content/gpcmdatabase.jsm":
  xpidata = ""
