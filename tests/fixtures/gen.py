# Make Django session fixtures. Run gen.sh. It makes one file for each Django version.
import json, sys, time
import django
from django.conf import settings

settings.configure(SECRET_KEY="test_django_secret_key_123")
django.setup()
from django.core import signing
from django.contrib.sessions.serializers import JSONSerializer

time.time = lambda: 1735969655  # Fixed clock. In base62 this is "1tTx0Z".
SALT = "django.contrib.sessions.SessionStore"
CASES = {
    "anonymous": {"test": "test"},
    "user": {"_auth_user_id": "1", "test": "test"},
    "compressed": {
        "_auth_user_backend": "django.contrib.auth.backends.ModelBackend",
        "_auth_user_hash": "test",
        "_auth_user_id": "1",
        "cart": [{"sku": f"item-{i}", "qty": i} for i in range(20)],
    },
    "unicode": {"name": "Zoë 😀", "city": "São Paulo"},
}
out = {
    "django": django.get_version(),
    "cases": {k: {"data": v, "session": signing.dumps(v, salt=SALT, serializer=JSONSerializer, compress=True)} for k, v in CASES.items()},
}
json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
