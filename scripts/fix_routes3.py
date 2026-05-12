import os
import re

CATEGORY_MAP = {
    'Character': 'CharacterCategory',
    'Building': 'BuildingCategory',
    'Equipment': 'EquipmentCategory',
    'Item': 'ItemCategory',
    'Troop': 'TroopCategory',
}

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "from '@/lib/prisma'" in content:
        return False

    original = content

    # Fix 1: Replace Promise.all with findMany + count pattern
    # Pattern: const [X, total] = await Promise.all([supabaseAdmin.from('T').findMany({...}), supabaseAdmin.from('TABLE').select('*', { count: 'exact', head: true })])
    
    def replace_promise_all(match):
        var_name = match.group(1)
        table = match.group(2)
        findmany_params = match.group(3)
        
        cat_table = CATEGORY_MAP.get(table, 'Category')
        
        # Build the Supabase query
        lines = []
        lines.append(f"const {{ data: {var_name}, error, count: total }} = await supabaseAdmin")
        lines.append(f"      .from('{table}')")
        lines.append(f"      .select('*, {cat_table}(*)', {{ count: 'exact' }})")
        
        # Extract orderBy
        order_matches = re.findall(r"(\w+):\s*'(desc|asc)'", findmany_params)
        for field, direction in order_matches:
            asc = 'true' if direction == 'asc' else 'false'
            lines.append(f"      .order('{field}', {{ ascending: {asc} }})")
        
        # Extract skip/take -> range
        skip_match = re.search(r'skip:\s*(\w+)', findmany_params)
        take_match = re.search(r'take:\s*(\w+)', findmany_params)
        if skip_match and take_match:
            lines.append(f"      .range({skip_match.group(1)}, {skip_match.group(1)} + {take_match.group(1)} - 1)")
        
        return '\n'.join(lines)

    content = re.sub(
        r"const\s+\[(\w+),\s*total\]\s*=\s*await\s+Promise\.all\(\[\s*\n\s*supabaseAdmin\.from\('(\w+)'\)\.findMany\(\{([^}]+)\}\),\s*\n\s*supabaseAdmin\.from\('[^']+'\)\.select\('\*',\s*\{\s*count:\s*'exact',\s*head:\s*true\s*\}\)\s*\n\s*\]\)",
        replace_promise_all,
        content
    )

    # Fix 2: Simple findMany without Promise.all
    # Pattern: supabaseAdmin.from('T').findMany({ orderBy: {...} })
    def replace_simple_findmany(match):
        table = match.group(1)
        params = match.group(2)
        
        cat_table = CATEGORY_MAP.get(table, 'Category')
        
        lines = []
        lines.append(f"const {{ data: items, error }} = await supabaseAdmin")
        lines.append(f"      .from('{table}')")
        
        # Check for include
        if 'include: { category: true }' in params:
            lines.append(f"      .select('*, {cat_table}(*)')")
        else:
            lines.append(f"      .select('*')")
        
        # Extract orderBy
        order_matches = re.findall(r"(\w+):\s*'(desc|asc)'", params)
        for field, direction in order_matches:
            asc = 'true' if direction == 'asc' else 'false'
            lines.append(f"      .order('{field}', {{ ascending: {asc} }})")
        
        return '\n'.join(lines)

    # Fix standalone findMany (not inside Promise.all)
    content = re.sub(
        r"const\s+\{ data:\s*(\w+),\s*error\s*\}\s*=\s*await\s+supabaseAdmin\.from\('(\w+)'\)\.findMany\(\{([^}]+)\}\)",
        lambda m: f"const {{ data: {m.group(1)}, error }} = await supabaseAdmin\n      .from('{m.group(2)}')\n      .select('*')\n      .order('sortOrder', {{ ascending: true }})",
        content
    )

    # Fix 3: Replace remaining .findMany( with .select('*')
    content = content.replace('.findMany({', ".select('*')\n      ")

    # Fix 4: Clean up leftover findMany params
    content = re.sub(r'\n\s*orderBy:\s*\[.*?\],?\s*\n', '\n', content)
    content = re.sub(r'\n\s*orderBy:\s*\{.*?\},?\s*\n', '\n', content)
    content = re.sub(r'\n\s*include:\s*\{.*?\},?\s*\n', '\n', content)
    content = re.sub(r'\n\s*where,\s*\n', '\n', content)
    content = re.sub(r'\n\s*skip,\s*\n', '\n', content)
    content = re.sub(r'\n\s*take:\s*\w+,?\s*\n', '\n', content)
    content = re.sub(r'\n\s*\}\),\s*\n', '\n', content)

    # Fix 5: Remove leftover where clause blocks
    content = re.sub(r"const\s+where:\s*any\s*=\s*\{\}\s*\n\s*if\s*\(category\)\s*\{\s*\n\s*where\.category\s*=\s*\{\s*slug:\s*category\s*\}\s*\n\s*\}\s*\n", '', content)

    # Fix 6: Fix extra closing braces from Promise.all removal
    content = re.sub(r'\n\s*\}\),\s*\n', '\n', content)

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
print('Starting fix pass 3...\n')
count = walk_dir(api_dir)
print(f'\nFixed {count} files.')