# $Id$

import sys
from pprint import pprint

def dump(arg):
  pprint(arg)
  return True
  
def printMsg(msg):
  print msg
  return True

def pause(prompt):
  if sys.platform.startswith("win"):
    try:
      import ctypes
      MessageBox = ctypes.windll.user32.MessageBoxA
      MessageBox(None, str(prompt), 'Mozmill Pause...', 0)
      return
    except: pass

  try:
    import getpass
    getpass.getpass(str(prompt))
    return True
  except Exception, exc:
    print `exc`

