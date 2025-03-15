import os
import shutil
import argparse


def copy_files_to_subfolder(
    source_dir, target_subfolder, excluded_folders=None, excluded_files=None
):
    """
    Recursively copy all files from source_dir and its subdirectories
    to a single subfolder within source_dir. Only copies files, not folders.

    Args:
        source_dir (str): Source directory path
        target_subfolder (str): Name of the target subfolder
        excluded_folders (list): List of folder names to exclude
        excluded_files (list): List of filenames to exclude
    """
    if excluded_folders is None:
        excluded_folders = [".kamal", ".github", ".git", "node_modules", ".vercel"]

    if excluded_files is None:
        excluded_files = [".keep"]

    # Convert to absolute paths
    source_dir = os.path.abspath(source_dir)
    target_path = os.path.join(source_dir, target_subfolder)

    # Create target subfolder if it doesn't exist
    if not os.path.exists(target_path):
        os.makedirs(target_path)
        print(f"Created target subfolder: {target_path}")

    # Collect all files first
    all_files = []

    for root, dirs, files in os.walk(source_dir):
        # Skip the target subfolder itself and excluded folders
        if os.path.abspath(root) == os.path.abspath(target_path):
            continue

        # Remove excluded folders from dirs to prevent descending into them
        dirs[:] = [d for d in dirs if d not in excluded_folders]

        for file in files:
            # Skip excluded files
            if file in excluded_files:
                continue

            source_file_path = os.path.join(root, file)
            all_files.append(source_file_path)

    # Now copy all the collected files (flat structure - all files in the target folder)
    for source_file_path in all_files:
        file_name = os.path.basename(source_file_path)
        target_file_path = os.path.join(target_path, file_name)

        # Handle filename conflicts by adding a counter
        counter = 1
        original_name, extension = os.path.splitext(file_name)
        while os.path.exists(target_file_path):
            new_filename = f"{original_name}_{counter}{extension}"
            target_file_path = os.path.join(target_path, new_filename)
            counter += 1

        try:
            shutil.copy2(source_file_path, target_file_path)
            print(f"Copied: {source_file_path} -> {target_file_path}")
        except Exception as e:
            print(f"Error copying {source_file_path}: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Copy all files in a directory to a specified subfolder."
    )
    parser.add_argument("source_dir", help="Source directory path")
    parser.add_argument("target_subfolder", help="Name of the target subfolder")
    parser.add_argument(
        "--exclude-folders", nargs="+", help="Additional folders to exclude", default=[]
    )
    parser.add_argument(
        "--exclude-files", nargs="+", help="Additional files to exclude", default=[]
    )

    args = parser.parse_args()

    # Combine default excluded items with any additional ones specified
    excluded_folders = [".kamal", ".github", ".git"] + args.exclude_folders
    excluded_files = [".keep"] + args.exclude_files

    copy_files_to_subfolder(
        args.source_dir, args.target_subfolder, excluded_folders, excluded_files
    )
    print("Operation completed!")


if __name__ == "__main__":
    main()
