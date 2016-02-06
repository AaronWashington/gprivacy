

###### File $Id$ ######

# Edit Listing #
## Basic Information ##
#### Summary ####
Make some popular websites respect your privacy settings.
Please see the known issues below!

#### Tags ####
bing, facebook, google, privacy, yahoo, youtube, clicktracking, tracking

## Images ##
Options dialog (v0.1.0)

Modified search results

Old options dialog

## Add-on Details ##
Google Search and other search engines and websites seem to ignore Mozilla's 'Do-Not-Track'-header and add tracking functions to their search results and external links anyway.
This add-on shows tracking-free links or optionally replaces the results with those links.

Websites supported (for now) are Google, YouTube, Yahoo!, Bing and Facebook.

<strong>Addon compatibility</strong>
<strong>Add-on compatibility</strong>
<ul>
<blockquote><li><i>NoScript and Facebook</i>: Facebook seems to detect an active NoScript and replaces external links with tracked ones. I do not have the intention to reverse this. Add Facebook to NoScripts trusted sites, if you want this add-on work.</li>
<li>For other pages, <i>NoScript</i> disables most of the tracking anyway!</li>
</ul>
<strong>Known Issues</strong>
<ul>
<li>Facebook has changed their click-tracking mechanism.<br>
<blockquote>This should be fixed in <a href='https://addons.mozilla.org/en-US/seamonkey/addon/google-privacy/versions/'>version 0.2.2</a>. Please let me know!</li>
</blockquote><li>Google log-on is not always recognized (v0.0.3-v0.2.2).</li>
</ul></blockquote>

<strong>Please Note: This software COMES AS IS! No warranties included - Please read also: <a href='http://code.google.com/p/gprivacy/wiki/README#Disclaimer'>DISCLAIMER</a>
If you're scared sh*tless now, don't use it!<br>
</strong>
That said, if you find any problems or websites that stopped working, please <a href='http://code.google.com/p/gprivacy/issues/entry'>report the issue</a>!
You may also visit the project's <a href='http://code.google.com/p/gprivacy/wiki/README'>gprivacy google code page</a> where you can find a short <a href='http://code.google.com/p/gprivacy/wiki/README#Options'>explanation of the preferences</a>,the latest <a href='http://code.google.com/p/gprivacy/downloads/list'>development version</a> and a <a href='http://code.google.com/p/gprivacy/issues/list'>problem issue tracking</a> system.

<strong>One More Thing</strong>
This add-on does not -- and cannot -- recognize every mechanism companies use  to track user behavior! In fact, this will be probably a losing battle.

With every redesign of a website, tracking mechanisms change, and this add-on <strong>will definitely</strong> become obsolete rather sooner than later. For our most used websites, We will try to keep this add-on as up-to-date as possible, but some others may fall through the cracks...

For this reason I suggest you don't use this add-on on its own. There are a lot of privacy and security add-ons out there, with <a href='https://addons.mozilla.org/en-US/addon/requestpolicy/'>RequestPolicy</a> and <a href='http://flashblock.mozdev.org/'>FlashBlock</a> being my favorites. I would recommend you to use these to together with this add-on. But there's also <a href='https://addons.mozilla.org/en-US/addon/noscript/'>NoScript</a>, which I personally don't use, but it comes highly recommended.

If you find that a website is starting to track you again or that this add-on  is causing errors on a page, you can <a href='http://code.google.com/p/gprivacy/issues/entry'>report the problem here</a>.

If on the other hand, you want to help out and extend this add-on, see what <a href='http://code.google.com/p/gprivacy/wiki/README#Developers'>developers can do</a>!

#### Homepage ####
http://code.google.com/p/gprivacy/wiki/README

## Technical Details ##
Google, YouTube, Yahoo!, Bing, Facebook and probably many other websites are trying to hide the fact that are tracking your clicks, even if you tell them not to.

They're doing this, sometimes by replacing the links as soon as press the mouse-button sometimes by adding other click handlers.

This means that even if you drag the seemingly harmless links to another tab or copy and paste the link, you still get tracked.


To see this effect (and for security reasons), I'd recommend you to install the excellent <a href='https://addons.mozilla.org/en-US//addon/requestpolicy/'>RequestPolicy</a> add-on!

# Authors and Licences #

## Privacy Policy ##
This add-on tries to prevent websites from logging user behavior.
As such, it <strong>does not</strong> transmit <strong>any</strong> data to any server by itself!

<strong>Please Note: This software is still in it's beta testing phase and COMES AS IS! - <a href='http://code.google.com/p/gprivacy/wiki/README#Disclaimer'>DISCLAIMER</a>
If you're scared sh*tless now, don't use it!<br>
</strong>

# Developer Profile #

## Why did you make this add-on ##
Having the add-on <a href='https://addons.mozilla.org/en-US/addon/requestpolicy'>RequestPolicy</a> installed, I noticed that clicks on many search results where blocked as redirects, even though their link address looked correct in the browser status.

Investigating a little, I found out, that the link targets where replaced by `JavaScript` code, as soon as the mouse went down on a link.

Initially it helped, clearing cookies and the cache for the website, but that stopped to work quite a while ago.

So the idea for this add-on was born.

## Whats next for this addon ##
<ul>
<blockquote><li>Bug fixes</li>
<li>Internal clean-up</li>
</ul></blockquote>

## Notes for reviewers ##
# v0.2.0 #
If there are any recommendations what to use instead of 'DOMNodeInserted' (like an observer), please tell me so...

# v0.2.3 #
Regarding the review of 0.2.2
1) All 'loose' variables except 'gprivacy' have been removed - this is used as the namespace.
2) All DOM-Nodes created are now prefixed with 'gprivacy-'.
3) Debug output was always _off_ by default and can be enabled in the advanced preferences on request, to assist troubleshooting. No debug output should be visible in a default installation. There were, however, two missed locations. These have been fixed.

# Contributions #

## Thank you note ##

Thank you for contributing to the development of gPrivacy!

You won't hear from us again - unless you decide to contribute once more ;-)

Thanks for your support!