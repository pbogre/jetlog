import os
import sys

def _get_environment_variable(key: str, cast_int: bool = False) -> str|int:
    value = os.environ.get(key)

    if not value:
        # env variable is necessary
        print(f"Environment variable '{key}' is not set. Aborting...")
        sys.exit(1)

    if cast_int:
        try:
            return int(value)
        except:
            print("Environment variable '{key}' should be an integer, got '{value}'")

    return value

DATA_PATH = _get_environment_variable("DATA_PATH")
SECRET_KEY = _get_environment_variable("SECRET_KEY")
AUTH_HEADER = _get_environment_variable("AUTH_HEADER")
TOKEN_DURATION = int(_get_environment_variable("TOKEN_DURATION", cast_int=True)) # double cast to make linter happy
