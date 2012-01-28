global xpidata

if item.filename == "chrome/content/gpchangemon.jsm":
  f = file("chrome/content/gpnullmon.jsm")
  xpidata = f.read()
  f.close()
