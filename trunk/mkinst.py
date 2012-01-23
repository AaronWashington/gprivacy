import sys, os, re, shutil, zipfile, glob

PROJ      = "gprivacy"
CHROMEJAR = PROJ

JAR  = r"E:\jdk1.6.0_18\bin\jar.exe"
SHA1 = r"E:\Develop\cygwin\bin\sha1sum.exe"
JSCHK= "jsshell -C"

if not os.path.isfile(JAR):
  JAR = r"J:\jdk1.6.0_18\bin\jar.exe"

def main(argv=sys.argv[1:]):
  f = file("install.rdf"); inst = f.read(); f.close()
  m = re.search(r'em:version="(.*?)"', inst)
  if m is None:
    m = re.search(r'<em:version>(.*?)</em:version>', inst)
  assert m != None, "Version not found in install.rdf"
  ver = m.group(1) + "-sm+fx"
  if os.path.exists("content"):
    # rc = os.system(JAR+" cv0Mf chrome\%s.jar content skin locale" % CHROMEJAR)
    # assert rc == 0, "RC = %s" % rc
    shutil.rmtree("chrome")
    os.mkdir("chrome")
    for d in [ "content", "skin", "locale" ]:
      shutil.copytree(d, os.path.join("chrome", d))
  print "checking js Syntax",
  for fn in glob.glob("*/*/*.js") + glob.glob("*/*/*.jsm"):
    print ".",
    os.system(JSCHK + " " + fn);
  print
  fname = "%s-%s.xpi" % (PROJ, ver)
  if os.path.exists(fname): os.remove(fname)
  rc = os.system(JAR+" cvMf %s chrome defaults chrome.manifest install.rdf" % fname)
  assert rc == 0, "RC = %s" % rc
  print "sha1:", 
  os.system(SHA1+" "+fname)
  print "Please update ..\update.rdf and run McCoy"

  
  famo = "%s-%s-amo.xpi" % (PROJ, ver)
  p = re.compile(r'\s*<em:updateURL>.*?</em:updateKey>\n', re.S)
  inst = p.sub('\n', inst)
  xpi = zipfile.ZipFile(fname, "r")
  amo = zipfile.ZipFile(famo, "w")
  for item in xpi.infolist():
    data = xpi.read(item.filename)
    if item.filename == "install.rdf": data = inst
    amo.writestr(item, data)
  amo.close(); xpi.close()

  
if __name__ == "__main__":
  main()
