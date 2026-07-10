#!/bin/sh
set -e

# Bind-mounted SQLite files are often owned by root; fix before dropping privileges.
if [ -f /app/database.db ]; then
  chown appuser:appuser /app/database.db
fi
chown appuser:appuser /app

exec gosu appuser "$@"
