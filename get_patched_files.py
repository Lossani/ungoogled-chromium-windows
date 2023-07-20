import os

affected_files = []
new_files = []
patches_path = [
    'patches',
    'ungoogled-chromium\\patches',
]

for ppath in patches_path:
    for path, subdirs, files in os.walk(ppath):
        for name in files:
            fullpath = os.path.join(path, name)
            if '.patch' in fullpath:
                with open(fullpath, 'r') as file:
                    Lines = file.readlines()
                    count = 0
                    # Strips the newline character
                    for line in Lines:
                        if '+++ b/' in line:
                            patched_file = line.strip()[6:]
                            print(patched_file)
                            affected_files.append(patched_file)
                        elif '--- /dev/null' in line:
                            if count + 1 < len(Lines):
                                if '+++ b/' in Lines[count + 1]:
                                    new_file = Lines[count + 1].strip()[6:]
                                    print("New file:", new_file)
                                    new_files.append(new_file)
                        count += 1

affected_files = list(dict.fromkeys(affected_files))

affected_files = [x for x in affected_files if x not in new_files]
                    
with open('affected_files.txt', 'w') as file:
    for f in affected_files:
        file.write(f + '\n')

with open('patches_created_files.txt', 'w') as file:
    for f in new_files:
        file.write(f + '\n')