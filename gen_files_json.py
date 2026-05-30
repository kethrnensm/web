import os
import json
import hashlib

def get_file_info(root_dir, file_path):
    full_path = os.path.join(root_dir, file_path)
    size = os.path.getsize(full_path)
    name = os.path.basename(file_path)
    # The launcher seems to use the path relative to the files directory
    return {
        "name": name,
        "size": size,
        "path": file_path.replace("\\", "/"),
        "url": "https://heromc.tokyo/files/" + file_path.replace("\\", "/")
    }

def generate_json(directory):
    files_list = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), directory)
            if file == "gen_files_json.py" or file == "files.json" or file == "client_config.json":
                continue
            files_list.append(get_file_info(directory, rel_path))

    data = {"files": files_list}
    with open(os.path.join(directory, "files.json"), "w") as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    # Example usage: point to the directory containing game files
    # generate_json(".")
    print("Python script for generating files.json created.")
