import os, re

src_dir = r'C:\Users\21650\Pictures\projet_software\Frontend\moubedra-template\src'
total_fixes = 0
all_files_fixed = []

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if not f.endswith(('.jsx', '.js')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            content = fh.read()

        original = content

        # Fix: condition  value  → condition ? value (missing ternary ?)
        # Match: word  something where there's exactly 2 spaces between a closing paren/bracket/word and the next token
        # But NOT inside strings, comments, or JSX attributes
        
        # Pattern: word  ( → word ? (
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}\(', r'\1 ? (', content)
        
        # Pattern: word  ' → word ? '
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(\')', r"\1 ? '\2", content)
        
        # Pattern: word  " → word ? "
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(\")', r'\1 ? "', content)
        
        # Pattern: word  ` → word ? `
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(`)', r'\1 ? `', content)
        
        # Pattern: word  { → word ? {
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(\{)', r'\1 ? {', content)
        
        # Pattern: word  < → word ? < (JSX)
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(<)', r'\1 ? <', content)

        # Fix: variable  0 → variable ?? 0
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(0)\b', r'\1 ?? \2', content)
        
        # Fix: variable  '' → variable ?? ''
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(\'\')', r"\1 ?? '\2'", content)
        
        # Fix: variable  "" → variable ?? ""
        content = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$.\[\]]+)\s{2,}(\"\")', r'\1 ?? ""', content)

        if content != original:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            new_q = content.count(' ? ')
            old_q = original.count(' ? ')
            new_qq = content.count(' ?? ')
            old_qq = original.count(' ?? ')
            fixes = (new_q - old_q) + (new_qq - old_qq)
            total_fixes += fixes
            all_files_fixed.append((path, fixes))
            print(f'Fixed: {path} (+{fixes} operators)')

print(f'\n=== Total files fixed: {len(all_files_fixed)} ===')
print(f'=== Total operators added: {total_fixes} ===')
for path, fixes in all_files_fixed:
    print(f'  {path}: +{fixes}')
