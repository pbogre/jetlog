import os
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("DATA_PATH", tempfile.mkdtemp(prefix="jetlog-tests-"))
os.environ.setdefault("SECRET_KEY", "jetlog-test-secret")
os.environ.setdefault("TOKEN_DURATION", "7")
os.environ.setdefault("ENABLE_EXTERNAL_APIS", "false")
repository_root = Path(__file__).parent.parent
sys.path.insert(0, str(repository_root))
sys.path.insert(0, str(repository_root / "server"))
