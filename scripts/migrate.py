import os
import re

MODEL_MAP = {
    'announcement': 'Announcement',
    'article': 'Article',
    'category': 'Category',
    'character': 'Character',
    'characterCategory': 'CharacterCategory',
    'characterFilterOption': 'CharacterFilterOption',
    'building': 'Building',
    'buildingCategory': 'BuildingCategory',
    'buildingFilterOption': 'BuildingFilterOption',
    'equipment': 'Equipment',
    'equipmentCategory': 'EquipmentCategory',
    'equipmentFilterOption': 'EquipmentFilterOption',
    'item': 'Item',
    'itemCategory': 'ItemCategory',
    'itemFilterOption': 'ItemFilterOption',
    'troop': 'Troop',
    'troopCategory': 'TroopCategory',
    'troopFilterOption': 'TroopFilterOption',
    'sidebarNav': 'SidebarNav',
}

CATEGORY_MAP = {
    'character': 'CharacterCategory',
    'building': 'BuildingCategory',
    'equipment': 'EquipmentCategory',
    'item': 'ItemCategory',
    'troop': 'TroopCategory',
}

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "from '@/lib/supabase'" in content:
        return False

    original = content

    # 1. Replace import
    content = content.replace(
        "import { prisma } from '@/lib/prisma'",
        "import { supabaseAdmin } from '@/lib/supabase'"
    )

    # 2. Replace prisma.X. with supabaseAdmin.from('TableName').
    for model, table in MODEL_MAP.items():
        content = content.replace(f'prisma.{model}.', f"supabaseAdmin.from('{table}').")

    # 3. Replace .findMany({...}) with .select('*')
    content = re.sub(r'\.findMany\(\{[^}]*\}\)', ".select('*')", content)

    # 4. Replace .findUnique({ where: { id: X }, ... }) with .select('*').eq('id', X).single()
    content = re.sub(
        r'\.findUnique\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}[^}]*\}\)',
        r".select('*')\n      .eq('id', \1)\n      .single()",
        content
    )

    # 5. Replace .create({ data: { ... }, include: ... }) with .insert({ ... }).select(...).single()
    content = re.sub(
        r'\.create\(\{\s*data:\s*\{(.*?)\}(.*?)\}\)',
        lambda m: f".insert({{\n{m.group(1)}\n      }}).select()\n      .single()",
        content,
        flags=re.DOTALL
    )

    # 6. Replace .update({ where: { id: X }, data: { ... }, include: ... })
    content = re.sub(
        r'\.update\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\},\s*data:\s*\{(.*?)\}(.*?)\}\)',
        lambda m: f".update({{\n{m.group(2)}\n      }})\n      .eq('id', {m.group(1)})\n      .select()\n      .single()",
        content,
        flags=re.DOTALL
    )

    # 7. Replace .delete({ where: { id: X } }) with .delete().eq('id', X)
    content = re.sub(
        r'\.delete\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}\s*\}\)',
        r".delete()\n      .eq('id', \1)",
        content
    )

    # 8. Replace .count({...}) with .select('*', { count: 'exact', head: true })
    content = re.sub(r'\.count\(\{[^}]*\}\)', ".select('*', { count: 'exact', head: true })", content)

    # 9. Replace const X = await supabaseAdmin... with const { data: X, error } = await supabaseAdmin...
    content = re.sub(
        r'const\s+(\w+)\s*=\s*await\s+supabaseAdmin',
        r'const { data: \1, error } = await supabaseAdmin',
        content
    )

    # 10. Replace standalone await supabaseAdmin... with const { error } = await supabaseAdmin...
    lines = content.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('await supabaseAdmin'):
            indent = line[:len(line) - len(line.lstrip())]
            new_lines.append(f'{indent}const {{ error }} = {stripped[6:]}')
        else:
            new_lines.append(line)
    content = '\n'.join(new_lines)

    # 11. Replace orderBy: { field: 'desc' } with .order('field', { ascending: false })
    content = re.sub(
        r"orderBy:\s*\{\s*(\w+):\s*'desc'\s*\}",
        r".order('\1', { ascending: false })",
        content
    )
    content = re.sub(
        r"orderBy:\s*\{\s*(\w+):\s*'asc'\s*\}",
        r".order('\1', { ascending: true })",
        content
    )

    # 12. Replace orderBy: [{ field: 'desc' }, { field2: 'desc' }]
    content = re.sub(
        r"orderBy:\s*\[\s*\{(\w+):\s*'desc'\}\s*,\s*\{(\w+):\s*'desc'\}\s*\]",
        r".order('\1', { ascending: false })\n      .order('\2', { ascending: false })",
        content
    )
    content = re.sub(
        r"orderBy:\s*\[\s*\{(\w+):\s*'asc'\}\s*,\s*\{(\w+):\s*'asc'\}\s*\]",
        r".order('\1', { ascending: true })\n      .order('\2', { ascending: true })",
        content
    )

    # 13. Add error handling after .single()
    content = re.sub(
        r'(\.single\(\))\s*\n(\s*)(return|if)',
        r'\1\n\n\2if (error) throw error\n\2\3',
        content
    )

    # 14. Add error handling after .select() without .single()
    content = re.sub(
        r"(\.select\('[^']*'(?:,\s*\{\s*count:\s*'exact'\s*\})?\))\s*\n(\s*)(return|if)",
        r'\1\n\n\2if (error) throw error\n\2\3',
        content
    )

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
                if migrate_file(filepath):
                    rel = os.path.relpath(filepath, os.path.dirname(dirpath))
                    print(f'  OK {rel}')
                    count += 1
    return count

base_dir = os.path.dirname(os.path.dirname(__file__))
api_dir = os.path.join(base_dir, 'src', 'app', 'api')
print('Starting migration...\n')
count = walk_dir(api_dir)
print(f'\nMigrated {count} files.')