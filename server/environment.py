import os
import sys

def _get_environment_variable(key: str, default: str|int|None = None, cast_int: bool = False) -> str|int:
    value = os.environ.get(key)

    if not value:
        if default == None:
            # env variable is necessary
            print(f"Environment variable '{key}' is not set. Aborting...")
            sys.exit(1)

        value = default

    if cast_int:
        try:
            return int(value)
        except:
            print("Environment variable '{key}' should be an integer, got '{value}'")

    return value

DATA_PATH = _get_environment_variable("DATA_PATH")
PATH_PREFIX = _get_environment_variable("PATH_PREFIX", default="")
SECRET_KEY = _get_environment_variable("SECRET_KEY")
TOKEN_DURATION = _get_environment_variable("TOKEN_DURATION", default=7, cast_int=True)
