pref("extensions.gprivacy.active",    true);
pref("extensions.gprivacy.active.loggedin", true);
pref("extensions.gprivacy.auto",      true);
pref("extensions.gprivacy.replace",   false);
pref("extensions.gprivacy.orig",      true);
pref("extensions.gprivacy.mark",      true);
pref("extensions.gprivacy.text",      true);
pref("extensions.gprivacy.debug",     false);
pref("extensions.gprivacy.anonlinks", false);
pref("extensions.gprivacy.embedded",  true);
pref("extensions.gprivacy.browserclick", false);
pref("extensions.gprivacy.changemon", 0); // hidden, add-on developers only ;)

pref("extensions.gprivacy.engines.google.enabled",   true);
pref("extensions.gprivacy.engines.google.allevts",   false);
pref("extensions.gprivacy.engines.google.own",       false);
pref("extensions.gprivacy.engines.yahoo.enabled",    true);
pref("extensions.gprivacy.engines.yahoo.allevts",    false);
pref("extensions.gprivacy.engines.yahoo.own",        false);
pref("extensions.gprivacy.engines.bing.enabled",     true);
pref("extensions.gprivacy.engines.bing.allevts",     false);
pref("extensions.gprivacy.engines.bing.own",         true);
pref("extensions.gprivacy.engines.facebook.enabled", true);
pref("extensions.gprivacy.engines.facebook.allevts", false);
pref("extensions.gprivacy.engines.facebook.own",     true);
pref("extensions.gprivacy.engines.youtube.enabled",  true);
pref("extensions.gprivacy.engines.youtube.allevts",  false);
pref("extensions.gprivacy.engines.youtube.own",      false);

// https://developer.mozilla.org/en/Localizing_extension_descriptions
pref("extensions.{ea61041c-1e22-4400-99a0-aea461e69d04}.description", "chrome://gprivacy/locale/overlay.properties");

// The AMO reviewers don't like those. I don't know why...
//pref("extensions.gprivacy.engines.google.match",     "https?://(\\w+\\.)*?(google)\\.\\w+/");
//pref("extensions.gprivacy.engines.yahoo.match",      "https?://(\\w+\\.)*?(yahoo)\\.\\w+/");
//pref("extensions.gprivacy.engines.bing.match",       "https?://(\\w+\\.)*?(bing)\\.\\w+/");
//pref("extensions.gprivacy.engines.facebook.match",   "https?://(\\w+\\.)*?(facebook)\\.\\w+/");
//pref("extensions.gprivacy.engines.youtube.match",    "https?://(\\w+\\.)*?(youtube)\\.\\w+/");
