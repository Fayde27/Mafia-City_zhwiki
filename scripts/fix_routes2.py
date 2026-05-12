import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "from '@/lib/prisma'" in content:
        return False
    
    original = content

    # Fix 1: .findUnique({ where: { id: X }, include: { category: true } })
    # Handle multi-line pattern
    content = re.sub(
        r'\.findUnique\(\{\s*\n\s*where:\s*\{\s*id:\s*([^}]+)\s*\},\s*\n\s*include:\s*\{\s*category:\s*true\s*\},\s*\n\s*\}\)',
        lambda m: f".select('*')\n      .eq('id', {m.group(1).strip()})\n      .single()",
        content
    )

    # Fix 2: .delete({ where: { id: X } }) - multi-line
    content = re.sub(
        r'\.delete\(\{\s*\n\s*where:\s*\{\s*id:\s*([^}]+)\s*\},\s*\n\s*\}\)',
        r".delete()\n      .eq('id', \1)",
        content
    )

    # Fix 3: .findMany({...}) with complex params - handle Promise.all
    # Pattern: [supabaseAdmin.from('X').findMany({...}), supabaseAdmin.from('X').count({...})]
    # Replace the entire Promise.all block
    
    # Fix 4: Clean up extra whitespace in insert/update
    content = re.sub(r'\.insert\(\{\s*\n\s{4,}', '.insert({\n        ', content)
    content = re.sub(r'\.update\(\{\s*\n\s{4,}', '.update({\n        ', content)
    
    # Fix 5: Remove trailing whitespace before })} in insert/update
    content = re.sub(r'\n\s{4,}\}\),', '\n      }),', content)
    content = re.sub(r'\n\s{4,}\}\)', '\n      })', content)

    # Fix 6: Fix missing await before supabaseAdmin in delete
    content = re.sub(
        r'const \{ error \} = supabaseAdmin\.from',
        r'const { error } = await supabaseAdmin.from',
        content
    )

    # Fix 7: Fix .eq('id', params.id ) with extra space
    content = re.sub(r"\.eq\('id',\s*(\w+)\s*\)", r".eq('id', \1)", content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def walk_dir(dirpath):
    count = 0
    for root, dirs, files in os.walk(dirpath):
        for file in files:
            if file == 'route.ts':
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    rel = os.path.relpath(filepath, os.path.dirname(dirpath))
                    print(f'  FIX {rel}')
                    count += 1
    return count

base_dir = os.path.dirname(os.path.dirname(__file__))
api_dir = os.path.join(base_dir, 'src', 'app', 'api')
print('Starting fix pass 2...\n')
count = walk_dir(api_dir)
print(f'\nFixed {count} files.')