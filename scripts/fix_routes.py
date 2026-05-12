import os
import re

CATEGORY_MAP = {
    'Character': 'CharacterCategory',
    'Building': 'BuildingCategory',
    'Equipment': 'EquipmentCategory',
    'Item': 'ItemCategory',
    'Troop': 'TroopCategory',
}

def get_category_table(content):
    for model, cat in CATEGORY_MAP.items():
        if f".from('{model}')" in content:
            return cat
    return 'Category'

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    cat_table = get_category_table(content)

    # 1. Fix findUnique({ where: { id: X }, include: { category: true } })
    content = re.sub(
        r'\.findUnique\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\},\s*include:\s*\{\s*category:\s*true\s*\}\s*\}\)',
        lambda m: f".select('*, {cat_table}(*)')\n      .eq('id', {m.group(1)})\n      .single()",
        content
    )

    # 2. Fix findUnique({ where: { id: X } }) without include
    content = re.sub(
        r'\.findUnique\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}\s*\}\)',
        r".select('*')\n      .eq('id', \1)\n      .single()",
        content
    )

    # 3. Fix delete({ where: { id: X } })
    content = re.sub(
        r'\.delete\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}\s*\}\)',
        r".delete()\n      .eq('id', \1)",
        content
    )

    # 4. Fix findMany with complex params - handle Promise.all pattern
    # Pattern: [supabaseAdmin.from('X').findMany({...}), supabaseAdmin.from('X').count({...})]
    # Replace with proper Supabase queries
    
    # First, fix the count part in Promise.all
    content = re.sub(
        r"supabaseAdmin\.from\('[^']+'\)\.select\('\*', \{ count: 'exact', head: true \}\)",
        r"supabaseAdmin.from('TABLE').select('*', { count: 'exact', head: true })",
        content
    )

    # Fix findMany with where, skip, take, orderBy, include
    def fix_findmany(match):
        table = match.group(1)
        params = match.group(2)
        
        # Build Supabase query
        query = f"supabaseAdmin.from('{table}').select('*'"
        
        # Check for include
        if 'include: { category: true }' in params or 'include: { category' in params:
            cat = CATEGORY_MAP.get(table, 'Category')
            query += f", {cat}(*)"
        
        query += "', { count: 'exact' })"
        
        # Check for orderBy
        order_matches = re.findall(r"(\w+):\s*'(desc|asc)'", params)
        for field, direction in order_matches:
            asc = direction == 'asc'
            query += f"\n      .order('{field}', {{ ascending: {str(asc).lower()} }})"
        
        # Check for skip/take -> range
        skip_match = re.search(r'skip:\s*(\w+)', params)
        take_match = re.search(r'take:\s*(\w+)', params)
        if skip_match and take_match:
            query += f"\n      .range({skip_match.group(1)}, {skip_match.group(1)} + {take_match.group(1)} - 1)"
        
        return query

    # This is complex, let me handle it differently
    # Replace the entire Promise.all block

    # 5. Fix const { data: X, error } = await supabaseAdmin...findUnique... patterns
    # These were already partially fixed but may have leftover findUnique
    
    # 6. Fix where clause patterns
    # where.category = { slug: category } -> filter on joined table
    # This is complex, let me handle it manually for now

    # 7. Clean up extra whitespace in insert/update blocks
    content = re.sub(r'\.insert\(\{\s*\n\s+', '.insert({\n        ', content)
    content = re.sub(r'\.update\(\{\s*\n\s+', '.update({\n        ', content)

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
print('Starting fix pass...\n')
count = walk_dir(api_dir)
print(f'\nFixed {count} files.')