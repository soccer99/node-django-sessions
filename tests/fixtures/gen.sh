#!/usr/bin/env sh
# Make the fixtures again: sh tests/fixtures/gen.sh
set -e
cd "$(dirname "$0")"
for v in 4.2 5.2 6.1; do
  uv run --no-project --python 3.12 --with "django~=$v.0" python gen.py > "django-$v.json"
  echo "wrote django-$v.json ($(python3 -c "import json;print(json.load(open('django-$v.json'))['django'])"))"
done
