"""
A Python script to properly deploy this on a server.
This is not meant to be used in development environment.

The script purpose is to do a build check before advancing the code
to the new status. If for some reasons the code fails to build,
it will stay at the last successfull deployment state.

This script assumes that the branch `previous-deploy` is the last successful deployment
and HEAD points to `origin/main`.
"""

# Why Python instead of Bash? Bcuz Python has better error handling.

from subprocess import run

# Health check, make sure git exist.
try:
    run("git status", shell=True, check=True)
except Exception:
    exit(1)

# Branch checks.
try:
    main_hash = run(
        "git rev-parse main", shell=True, check=True, capture_output=True
    ).stdout
    previous_successful_hash = run(
        "git rev-parse previous-deploy", shell=True, check=True, capture_output=True
    ).stdout
    if main_hash != previous_successful_hash:
        raise Exception("'main' and 'previous-deploy' aren't the same.")

    remote_hash = run(
        "git rev-parse origin/main", shell=True, check=True, capture_output=True
    ).stdout
    head_hash = run(
        "git rev-parse HEAD", shell=True, check=True, capture_output=True
    ).stdout
    if remote_hash != head_hash:
        raise Exception("HEAD is not up-to-date with 'origin/main'.")

except Exception as error:
    print(error)
    print("Aborting.")
    exit(1)

try:
    run("npm run prisma:apply && npm run prisma:generate", shell=True, check=True)
except Exception:
    print("Unable to migrate. Aborting.")
    # TODO: Rollback migration on exception.
    # If the migration fails here,
    # https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations#how-to-generate-and-run-down-migrations
    # https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations#how-to-apply-your-down-migration-to-a-failed-migration

    # Basically we're screwed if this happens :)

    # On a more serious note, this requires a down.sql file ALREADY GENERATED
    # when developing. So basically it has to already exist on GitHub before the server
    # pull the code.
    # The rest is to apply the down.sql file as detailed by the 2nd URL.

    exit(1)

try:
    run("npm run build", shell=True, check=True)
    run("git switch main && git merge --ff-only origin/main", shell=True, check=True)
except Exception as error:
    # TODO: Rollback migration on exception.
    # https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations#considerations-when-generating-down-migrations

    # The TLDR is since we already applied the migration successfully,
    # we need to copy the old prisma.schema file from 'previous-deploy' branch to
    # 'new-deploy' branch, then run prisma:deploy from 'new-deploy'.
    # We then definitely need to reset 'new-deploy' to origin/main so the rest of Actions can clean up properly.

    print(error)
    print("Aborting.")

    # Cancel a merge just in case there's error when fast-forwarding.
    # No need to check for exception cuz abort will fail if there's no merge.
    run("git merge --abort", shell=True)
    # Only possible error here is main branch doesn't exist somehow.
    # This is probably not needed cuz I think --abort restore main
    # to its previous state, but here just in case.
    run("git switch main && git reset --hard previous-deploy", shell=True)
    exit(1)
