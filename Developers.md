# Extending gprivacy #

`gprivacy` can be extended for other websites by creating small add-ons.
These add-ons are regular Mozilla add-ons (see the
[Mozilla Add-On Developer page](https://addons.mozilla.org/en-US/developers/)),
that use `gprivacy`s small engine-API.

So you should be familiar with developing add-ons for Mozilla products.

## Add-on template ##
There's a sample add-on engine in
[engines/ask.com](http://code.google.com/p/gprivacy/source/browse/#svn%2Ftrunk%2Fengines%2Fask.com).

[chrome/content/engine.jsm](http://code.google.com/p/gprivacy/source/browse/trunk/engines/ask.com/chrome/content/engine.jsm)
contains some hints how to write your own. Just to mention it again: You **do not** need to implement **any** of the methods there, they're just documentation!

In addition to the three preferences defined in
[defaults/preferences/prefs.js](http://code.google.com/p/gprivacy/source/browse/trunk/engines/ask.com/defaults/preferences/prefs.js),
there's a fourth one, `gprivacy.engines.<ID>.custom`, which allows the
re-definition of the URL-matching-pattern, mainly during development.

## Rapid development ##

You do not have to create a full add-on to test your engine.
If you set the hidden preference `extensions.gprivacy.engines.custom.<ID>`
to something like
`file:///C:/Develop/XUL/gprivacy/engines/ask.com/chrome/content/engine.jsm`,
gprivacy will load the engine on browser start.

Be sure to enable watch the error console.

You have to set your default preferences through the `PREF_xxx`-attributes
in your engines prototype, though.