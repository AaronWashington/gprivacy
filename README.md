<a href='Hidden comment: 
== CONTENTS ==
* [#About About]
* [#Download Download]
* [#Options Options]
* [#Compatibility Compatibility]
* [#Support Support]
* [#Developers Developers]
* [#Screenshots Screenshots]
'></a>

# About #
[gprivacy](http://code.google.com/p/gprivacy/) is an add-on for
[SeaMonkey](http://www.seamonkey-project.org/) and
[Firefox](http://www.mozilla.com/firefox/), that tries make certain popular
websites respect the browser's
[DNT (Do Not Track) flag](http://en.wikipedia.org/wiki/Do_not_track_header).

`gprivacy` works by adding a cleaned-up link to every link that it recognizes
as having tracking functionality.

## Disclaimer ##
> This program is distributed in the hope that it will be useful, but
> WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  The author
> assumes no liability for damages arising from use of this program OR
> of any data that might be distributed with it.

## Another Disclaimer ##
> `gprivacy` does not -- and cannot -- recognize every mechanism companies use
> to track user behavior! In fact, this will be probably a losing battle.

> With every redesign of a website, tracking mechanisms change, and
> `gprivacy` **will definitely** become obsolete rather sooner than later.
> For our most used websites, we will try to keep this add-on as up-to-date
> as possible, but some others may fall through the cracks...

> For this reason I suggest you don't use this add-on on its own. There are
> a lot of privacy and security add-ons out there, with
> [RequestPolicy](https://addons.mozilla.org/en-US/addon/requestpolicy/)
> and [FlashBlock](http://flashblock.mozdev.org/) being my favorites.
> I would recommend you to use these to together with this add-on.
> But there's also [NoScript](https://addons.mozilla.org/en-US/addon/noscript/),
> which I personally don't use but it comes highly recommended.

> If you find that a website is starting to track you again or that `gprivacy`
> is causing errors on a page, please head over to the
> [support section](#Support.md) and find our contact addresses.

> If on the other hand, you want to help out and extend `gprivacy`, see what
> [developers can do](#Developers.md)!

# Download #
Please download the latest version from the
[Mozilla Add-On Site](https://addons.mozilla.org/en-US/addon/google-privacy/).

Brave beta-testers may obtain a copy of the latest development releases
[here](http://code.google.com/p/gprivacy/downloads/list).

# Options #
![http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-options.default.jpg](http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-options.default.jpg)

#### General ####
  * **Privacy active** - Switch `gprivacy` on or off.
  * **Replace original links** - Instead of adding a link, replace the existing one.
  * **Show original links** - If replaced, add the infested link too.
  * **Mark modified links** - Mark links with small icons (![http://gprivacy.googlecode.com/svn/trunk/chrome/skin/private16.png](http://gprivacy.googlecode.com/svn/trunk/chrome/skin/private16.png), ![http://gprivacy.googlecode.com/svn/trunk/chrome/skin/tracking16.png](http://gprivacy.googlecode.com/svn/trunk/chrome/skin/tracking16.png))
  * **Show descriptive text** - Add '`private`' or '`tracked`' to the appended links. Either this or the previous option _must_ be set.
  * **Change links when loading pages** - If switched off, you have to make the tracked links private manually. Use the context menu of the page to do this. Use, if some pages don't work.

#### Website Options ####
  * **Own links allowed** - Links to the same website will not be modified. This prevents the cluttering of some websites by sacrificing a little privacy. This is usually not a problem, as the links target is clearly visible in the browsers status, and the website can register the click anyway.
  * **All Clicks ![http://gprivacy.googlecode.com/svn/trunk/chrome/skin/attention16.png](http://gprivacy.googlecode.com/svn/trunk/chrome/skin/attention16.png)** - Try to catch **`*`every`*`** click on recognized links, and block it. Use this only, if you don't trust a website, as this might impair its functionality!

#### Advanced Options ####
![http://gprivacy.googlecode.com/svn/trunk/chrome/skin/attention16.png](http://gprivacy.googlecode.com/svn/trunk/chrome/skin/attention16.png)
You should leave this options as is, unless asked by the developers to
change them!

  * **Route private links through browser** - Every click on a private link will look as if it's been started like a bookmark. Neither the originating nor the destination server will know where the click came from. Not necessarily desirable.
  * **Mark empty and JavaScript links** - In combination with **All Clicks**, this blocks almost every possibility for website to track clicks. But it also almost certainly completely breaks it! You might as well use [NoScript](https://addons.mozilla.org/en-US/addon/noscript/) or turn JavaScript off completely. That's probably safer.
  * **Debug output to console** - Write verbose output to the browsers error console. On large websites, this might severely impact performance.

# Compatibility #
As you may understand, there's no to have all possible combinations of add-ons
installed in my testing environment, but I'm trying to test at least with
some of the most popular ones. My [favorite add-ons](https://addons.mozilla.org/en-US/firefox/collections/herrminator/ess/) are tested anyway...

So far I have found out the following:
  * **avast! WebRep**:
> > Appearance depends on the install order. If you install WebRep after `gprivacy`, WebRep marks both generated links. If it's the other way round, `gprivacy` comes in second and everything looks fine. This applies to automatic updates, too. If you don't like two WebReps per link, just re-install `gprivacy` for now. I'll try to find a way...

# Support #
If you want to report a link that has been tracked, though it was marked private,
or you find a problem with `gprivacy`, please
[report the issue](http://code.google.com/p/gprivacy/issues/entry).

Though you have to sign up with Google Code to do this, this is really the preferred
way to communicate problems, as they are best documented this way

To avoid spamming, `gprivacy`'s support e-mail address can only be found on the
[Add-On Site](https://addons.mozilla.org/en-US/addon/google-privacy/)
(beside the _About this Add-on_ section). Please use moderately!

# Developers #
`gprivacy` is extensible! If you know a website that violates peoples privacy
but offers otherwise useful content - And you know how to create add-ons for
Mozilla products, head over to the [Developer Page](Developers.md)!

# Screenshots #

Google search results with `gprivacy`'s default settings.
![http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-result.1.jpg](http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-result.1.jpg)

Google search results with my favorite settings.
![http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-result.2.jpg](http://gprivacy.googlecode.com/svn/wiki/screens/gprivacy-result.2.jpg)