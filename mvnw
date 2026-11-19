#!/bin/sh
# ----------------------------------------------------------------------------
# Maven Wrapper script for UNIX
# ----------------------------------------------------------------------------
set -e
[ -z "$JAVA_HOME" ] && echo "JAVA_HOME is not set" && exit 1
MAVEN_VERSION="3.9.9"
WRAPPER_DIR="$HOME/.m2/wrapper/dists/apache-maven-$MAVEN_VERSION"
if [ ! -d "$WRAPPER_DIR" ]; then
  mkdir -p "$WRAPPER_DIR"
  echo "Downloading Maven $MAVEN_VERSION..."
  curl -fsSL "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.tar.gz" | tar -xz -C "$WRAPPER_DIR" --strip-components=1
fi
exec "$WRAPPER_DIR/bin/mvn" "$@"
