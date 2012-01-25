#!/bin/env python
import sys, os, re, shutil, zipfile, glob, optparse, time

DEFPROJ    = "gprivacy"

ROOT_FILES = "chrome defaults chrome.manifest install.rdf changelog.txt"
OUTDIR     = "versions"

JAR     = os.environ.get("JAR",      "jar")
SHA1SUM = os.environ.get("SHA1SUM",  "sha1sum")
SVN     = os.environ.get("SVN",      "svn")
JSCHK   = os.environ.get("JSCHK",    "jsshell -C")

def main(argv=sys.argv[1:]):
  op = optparse.OptionParser()
  op.add_option("-p", "--project",   default=DEFPROJ)
  op.add_option("-d", "--directory", default=None)
  op.add_option("-i", "--inpdir",    default=".")
  op.add_option("-o", "--outdir",    default="versions")
  op.add_option("-b", "--builddir",  default="build", help="only for SVN")
  op.add_option("-a", "--AMO",       default=False,   help="build AMO version", action="store_true")
  
  opts, args = op.parse_args(argv);

  outdir  = os.path.abspath(opts.outdir)
  inpdir  = os.path.abspath(opts.inpdir)
  svnbdir = "%s\\%s" % (opts.outdir, opts.builddir)
  
  cwd = os.getcwd()

  if os.path.isdir(os.path.join(inpdir, ".svn")):
    rc = os.system(SVN + ' export "%s" "%s"' % (inpdir, svnbdir))
    assert rc == 0, "SVN export failed"
    inpdir = svnbdir

  try:
    f = file(os.path.join(inpdir, "install.rdf")); inst = f.read(); f.close()
    m = re.search(r'em:version="(.*?)"', inst)
    if m is None:
      m = re.search(r'<em:version>(.*?)</em:version>', inst)
    assert m != None, "Version not found in install.rdf"
    ver = m.group(1) + "-sm+fx"

    if JSCHK:
      print "checking js Syntax",
      js = []
      for jse in [ ".js", ".jsm" ]:
        for jsd in [ "*/*", "*/*/*"]:
          js += glob.glob(os.path.join(inpdir, "*/*/*"+jse))
      for fn in js:
        print ".",
        rc = os.system(JSCHK + " " + fn);
        assert rc == 0, "Syntax check failed!"
      print; sys.stdout.flush()
    else:
      print "Syntax check omitted!"

    fname = os.path.join(outdir, "%s-%s.xpi" % (opts.project, ver))
    if os.path.exists(fname): os.remove(fname)
    rf = " ".join([r for r in ROOT_FILES.split() if os.path.exists(os.path.join(inpdir, r))])
    # jar -C is only valid for one (the next) name
    os.chdir(inpdir)
    
    rc = os.system(JAR+' cvMf "%s" %s' % (fname, rf))
    assert rc == 0, "RC = %s" % rc

    print "sha1:", 
    os.system(SHA1SUM+" "+fname)
    print "Please update update.rdf and run McCoy"

    if opts.AMO:
      famo = os.path.join(outdir, "%s-%s-amo.xpi" % (project, ver))
      p = re.compile(r'\s*<em:updateURL>.*?</em:updateKey>\n', re.S)
      inst = p.sub('\n', inst)
      xpi = zipfile.ZipFile(fname, "r")
      amo = zipfile.ZipFile(famo, "w")
      for item in xpi.infolist():
        data = xpi.read(item.filename)
        if item.filename == "install.rdf": data = inst
        amo.writestr(item, data)
      amo.close(); xpi.close()

  finally:
    os.chdir(cwd)
    print "Done."
    if os.path.isdir(svnbdir):
      shutil.rmtree(svnbdir)

if __name__ == "__main__":
  sys.exit(main())
