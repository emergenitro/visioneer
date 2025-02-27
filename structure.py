import os
import fnmatch


def read_gitignore(gitignore_path):
    """Read the .gitignore file and return a list of patterns to ignore."""
    ignore_patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r") as file:
            for line in file:
                # Strip comments and whitespace
                line = line.strip()
                if line and not line.startswith("#"):
                    ignore_patterns.append(line)
    return ignore_patterns


def is_ignored(path, ignore_patterns, root_dir):
    """Check if a path matches any of the ignore patterns."""
    relative_path = os.path.relpath(path, root_dir)
    ignore_patterns.append(".git")  # Always ignore the .git directory
    for pattern in ignore_patterns:
        # Match the pattern against the relative path
        if fnmatch.fnmatch(relative_path, pattern) or fnmatch.fnmatch(
            os.path.basename(path), pattern
        ):
            return True
        # Handle directory patterns ending with '/'
        if pattern.endswith("/") and relative_path.startswith(pattern.rstrip("/")):
            return True
    return False


def list_directory_tree(root_dir, ignore_patterns, prefix=""):
    """Recursively list the directory tree, ignoring specified patterns."""
    items = sorted(os.listdir(root_dir))
    for index, item in enumerate(items):
        item_path = os.path.join(root_dir, item)
        if is_ignored(item_path, ignore_patterns, root_dir):
            continue

        connector = "└── " if index == len(items) - 1 else "├── "
        print(prefix + connector + item)

        if os.path.isdir(item_path):
            extension = "    " if index == len(items) - 1 else "│   "
            list_directory_tree(item_path, ignore_patterns, prefix + extension)


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    gitignore_path = os.path.join(current_dir, ".gitignore")
    ignore_patterns = read_gitignore(gitignore_path)

    print(f"Directory tree for {current_dir}:")
    list_directory_tree(current_dir, ignore_patterns)


if __name__ == "__main__":
    main()
