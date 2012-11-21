# $Id$

import os, copy, mozmill, mozrunner, glob

GPRIVACY_DEFAULT_EXT = "../versions/gprivacy-0.2.3pre1-sm+fx-amo.xpi"

# Try to find latest version
for en in sorted(glob.glob(os.path.join("..","versions","gprivacy-*.xpi")),
                 reverse=True):
  GPRIVACY_DEFAULT_EXT = en
  break
  
try:    import pysqlite2.dbapi2 as sql
except: import sqlite3.dbapi2   as sql

class GprivacyProfile(mozrunner.FirefoxProfile):
  preferences = mozrunner.FirefoxProfile.preferences.update({
    "extensions.gprivacy.logfile": os.path.abspath(os.path.join(os.path.dirname(__file__), "tmp", "gprivacy.log")),
    
    "extensions.requestpolicy.allowedOriginsToDestinations": 
       "google.com|gstatic.com gstatic.com|google.com google.com|google.de google.de|google.com google.com|google.fr google.fr|google.com gmail.com|google.com googlemail.com|google.com google.com|ggpht.com gmodules.com|googleapis.com google.de|googlepages.com google.fr|googlepages.com googlepages.com|google.com " +\
       "facebook.com|fbcdn.net fbcdn.net|facebook.com facebook.com|akamaihd.net facebook.com|recaptcha.net facebook.com|facebook.net " +\
       "yahoo.com|yimg.com yimg.com|yahoo.com youtube.com|ytimg.com " +\
       "youtube.com|google.com youtube.com|gstatic.com",
    "extensions.requestpolicy.initialSetupDialogShown": True,
    "extensions.requestpolicy.lastVersion": "0.5.24",
    
    # Override some of mozmills defaults
    "browser.rights.1.shown": True,
    "browser.rights.3.shown": True,
    "browser.startup.homepage": "about:blank",
    "browser.startup.homepage.count": 1,
    "browser.startup.homepage_override.mstone": "ignore",
    "extensions.installDistroAddons": True,
    "font.default.x-western": "sans-serif",
    "font.minimum-size.x-western": 9, # avoid linebreaks
    "font.size.fixed.x-western": 11, 
    "font.size.variable.x-western": 12,
    "layout.css.report_errors": False,
    "security.warn_viewing_mixed": False,
    "shell.checkDefaultClient": False,
    "signon.rememberSignons": False,
  })
  
class GprivacyMill(mozmill.MozMill):
  def __init__(self,
               runner_class=mozrunner.FirefoxRunner, profile_class=GprivacyProfile,
               jsbridge_port=24242, jsbridge_timeout=60):
    super(GprivacyMill, self).__init__(runner_class, profile_class,
                                       jsbridge_port, jsbridge_timeout)

class CLI(mozmill.CLI):
  mozmill_class = GprivacyMill

  parser_options = copy.copy(mozmill.CLI.parser_options)
  parser_options[("-g", "--gprivacy",)] =\
                                    dict(dest="gprivacy", help="gprivacy extension (%s)" % GPRIVACY_DEFAULT_EXT,
                                         default=GPRIVACY_DEFAULT_EXT)
  parser_options[("--template",)] = dict(dest="template", default=None,
                                         help="Template Profile for cookies")
  parser_options[("-a", "--addons",)] = dict(dest="addons", 
                                             help="Addons paths to install.", metavar=None,
                                             default="requestpolicy-latest-sm+fx.xpi")

  def __init__(self):
    super(CLI, self).__init__()
    self.addons += [ self.options.gprivacy ]
    print "Using gprivacy: '%s'" % self.options.gprivacy

    if not self.tests:
       mp = mozmill.manifestparser.TestManifest(manifests=["tests/gprivacy.ini"])
       self.tests.extend(mp.test_paths())

    if not self.tests:
      raise Exception("Where's the tests?")

  def get_profile(self, *args, **kwargs):
    profile = super(CLI, self).get_profile(*args, **kwargs)
    if self.options.template:
      db = sql.connect(os.path.join(profile.profile, "cookies.sqlite"))
      db.executescript("""
        CREATE TABLE if not exists moz_cookies (id INTEGER PRIMARY KEY, baseDomain TEXT, name TEXT, value TEXT, host TEXT, path TEXT, expiry INTEGER, lastAccessed INTEGER, creationTime INTEGER, isSecure INTEGER, isHttpOnly INTEGER, CONSTRAINT moz_uniqueid UNIQUE (name, host, path));

        CREATE INDEX if not exists moz_basedomain ON moz_cookies (baseDomain);

        attach '%s\\cookies.sqlite' as template;

        insert into moz_cookies
          select * from template.moz_cookies
          where  baseDomain in ('facebook.com', 'bing.com'); --, 'google.com', 'yahoo.com'
      """ % self.options.template);
      db.close()    
    return profile    

def cli():
    CLI().run()

if __name__ == "__main__":
  cli()
