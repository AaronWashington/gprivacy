# @change: please adjust to your needs
# export JSCHK=jsshell -C
export JSCHK="" # disables JavaScript syntax check
# export JAR=jar
# export SHA1SUM=sha1sum
# export SVN=svn

mkinst.py -i .               -o versions || exit
mkinst.py -i engines/ask.com -o versions || exit
