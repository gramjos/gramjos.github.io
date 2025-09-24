import os
import json

def generate_file_structure(start_path, output_file):
    """
    Generates a JSON file representing the directory structure.
    """
    def get_dir_structure(path):
        result = []
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                result.append({
                    "name": item,
                    "type": "directory",
                    "children": get_dir_structure(item_path)
                })
            else:
                result.append({
                    "name": item,
                    "type": "file",
                    "path": os.path.relpath(item_path, start_path)
                })
        return result

    structure = get_dir_structure(start_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structure, f, indent=4)

if __name__ == '__main__':
    # The directory to scan
    vault_dir = 'try_hosting_Vault_ready_2_serve'
    # The output file
    json_output_file = os.path.join(vault_dir, 'file_structure.json')
    
    generate_file_structure(vault_dir, json_output_file)
    print(f"File structure generated at {json_output_file}")
