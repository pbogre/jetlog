import os
import sys

def _get_environment_variable(key: str) -> str:
    value = os.environ.get(key)

    if not value:
        # env variable is necessary
        print("[ERROR] Environment variable '" + key + "' is not set. Aborting...")
        sys.exit(1)

    return value

DATA_PATH = _get_environment_variable("DATA_PATH")
