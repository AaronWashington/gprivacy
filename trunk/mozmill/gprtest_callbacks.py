# $Id$

from pprint import pprint

def dump(arg):
  pprint(arg)
  return True
  
def printMsg(msg):
  print msg
  return True

def pause(prompt):
  try:
    import getpass
    getpass.getpass(str(prompt))
    return True
  except Exception, exc:
    print `exc`

