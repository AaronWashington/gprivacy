

# Google #

## Search: http://www.google.com ##
  * `"onmousedown"`-handler, that rewrites the result links. Turning JavaScript off disables this, but also most of the functionality. Once the click is finished (mouse released), you'll get redirected by a intermediate google page.
  * Unfortunately, document clicks are handled by event listeners, that have to be prevented. This breaks the formatted results (bold words in the link), so formatting had to be removed.

## Mail: https://mail.google.com ##
  * External links in mails don't seem to get tracked. How nice of you :-)

## News: http://news.google.com ##
  * A `"click"`-event listener, that checks for the class `"_tracked"` and doesn't try to redirect if present.

## Documents: https://docs.google.com ##
  * Not tested yet, but probably not useful to block a lot there...


# Yahoo! #

## Search: http://search.yahoo.com ##
  * A _capturing_ event listener does a background ping home, as soon as the mouse goes down on the link.
  * Brute force helps (capture all click events and open the link via browser API)

## Mail: https://mail.google.com ##
  * Also here, extern links in mails seem OK.

## My Yahoo! http://my.yahoo.com ##
  * External links on My! usually open a reader panel, that will of course be tracked. Preventing this loses some of the convenience of this portal.

## News: http://news.yahoo.com ##
  * Yahoo! has its own big news service, so almost all of the links on the portal point to Yahoo! pages. So of course, they know what you're clicking ;-)


# Bing #

## Search: http://www.bing.com ##
  * `"onmousedown"`-handler, that _immediately_ phones home. Remove it, and youre in the clear!

## Hotmail: https://www.hotmail.com ##
  * A nasty capturing event listener, that pings 'Mike@live.com' (http://g.live.com/_9uxp9en-us/mike?YourLink) on a complete `"click"`-event. Mike shouldn't know!
  * You have to click 'Show content' first, though - and I won't remove it. It's there for a reason, and it's harmless...
  * If you confirm their "Allow bla bla..." dialog, you'll get tracked!
  * The only thing that really helps is brute force (see Yahoo! Search)!

# YouTube #
  * An event listener, that opens a YouTube redirect-page. Unfortunately, overriding this, breaks Ctrl-Clicks to open the link in a new window. But there's a simpler method: set the magic attribute `"data-redirect-href-updated"` to `"true"`, and everything's fine.

# Facebook #
  * Another simple `"onmousedown"`-handler, that opens a redirect-page. The problem with FB is, not to break its formatting completely.
  * Facebook seems to recognize NoScript and sends the tracking links immediately. You can recognize them, but not avoid them anymore! How long will it take, until they recognize `gprivacy`...

# Ask.com #