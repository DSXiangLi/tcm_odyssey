"""Database migrations and initialization."""

import json
from pathlib import Path
from datetime import datetime
from .connection import get_db
from .schema import init_database

def migrate_from_tasks_json():
    """Migrate data from Hermes TASKS.json."""
    tasks_json_path = Path(__file__).parent.parent.parent / 'hermes' / 'npcs' / 'qingmu' / 'TASKS.json'

    if not tasks_json_path.exists():
        print("[Migration] TASKS.json not found, skipping")
        return

    try:
        with open(tasks_json_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[Migration] TASKS.json malformed: {e}")
        return
    except Exception as e:
        print(f"[Migration] Error reading TASKS.json: {e}")
        return

    conn = get_db()

    player_id = data['player_id']
    updated_at = data['last_updated']

    for task in data['tasks']:
        # Insert task
        conn.execute("""
            INSERT OR IGNORE INTO tasks
            (player_id, task_id, title, type, status, progress, blocked_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            player_id, task['task_id'], task['title'], task['type'],
            task['status'], task['progress'], task.get('blocked_by'),
            updated_at, updated_at
        ))

        # Insert todos
        for todo in task.get('todos', []):
            conn.execute("""
                INSERT OR IGNORE INTO todos
                (task_id, todo_id, name, mastery, status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                task['task_id'], todo['id'], todo['name'],
                todo['mastery'], todo['status'], updated_at
            ))

    conn.commit()
    print(f"[Migration] Migrated {len(data['tasks'])} tasks from TASKS.json")

def initialize_database():
    """Initialize database with schema and migrate data."""
    conn = get_db()
    init_database(conn)
    migrate_from_tasks_json()
    migrate_inventory(conn, Path(__file__).parent.parent.parent)
    migrate_game_task_fields(conn)  # 新增：迁移游戏任务字段
    print("[Database] Initialization complete")


def migrate_game_task_fields(conn):
    """迁移游戏任务扩展字段到tasks表（Phase 2.5新增）."""
    try:
        # 检查字段是否已存在
        columns = conn.execute("PRAGMA table_info(tasks)").fetchall()
        column_names = [col[1] for col in columns]

        fields_to_add = [
            ('game_type', 'TEXT'),
            ('game_config', 'TEXT'),
            ('score', 'REAL DEFAULT 0.0'),
            ('reward', 'TEXT'),
            ('version', 'INTEGER DEFAULT 0')
        ]

        for field_name, field_type in fields_to_add:
            if field_name not in column_names:
                conn.execute(f"ALTER TABLE tasks ADD COLUMN {field_name} {field_type}")
                print(f"[Migration] Added field '{field_name}' to tasks table")

        conn.commit()
        print("[Migration] Game task fields migration complete")

    except Exception as e:
        print(f"[Migration] Error adding game task fields: {e}")
        conn.rollback()

def migrate_inventory(conn, project_root: Path):
    """Migrate 86 herbs data from inventory-herbs.ts."""
    herbs_data = [
        # 解表药 (9种)
        ('mahuang', '麻黄', 'jiebiao', '温', '辛微苦', '肺·膀胱', 2, 12, 8),
        ('guizhi', '桂枝', 'jiebiao', '温', '辛甘', '心·肺·膀胱', 1, 8, 15),
        ('zisuye', '紫苏叶', 'jiebiao', '温', '辛', '肺·脾', 1, 5, 7),
        ('jingjie', '荆芥', 'jiebiao', '微温', '辛', '肺·肝', 1, 3, 4),
        ('fangfeng', '防风', 'jiebiao', '微温', '辛甘', '膀胱·肝·脾', 2, 0, 6),
        ('bohe', '薄荷', 'jiebiao', '凉', '辛', '肺·肝', 1, 14, 9),
        ('juhua', '菊花', 'jiebiao', '微寒', '甘苦', '肺·肝', 1, 9, 12),
        ('gegen', '葛根', 'jiebiao', '凉', '甘辛', '脾·胃', 2, 4, 2),
        ('chaihu', '柴胡', 'jiebiao', '凉', '苦辛', '肝·胆', 2, 2, 5),
        # 清热药 (8种)
        ('shigao', '石膏', 'qingre', '大寒', '甘辛', '肺·胃', 1, 7, 3),
        ('zhimu', '知母', 'qingre', '寒', '苦甘', '肺·胃·肾', 2, 5, 8),
        ('huangqin', '黄芩', 'qingre', '寒', '苦', '肺·胆·脾', 2, 11, 6),
        ('huanglian', '黄连', 'qingre', '寒', '苦', '心·脾·胃', 3, 3, 4),
        ('huangbai', '黄柏', 'qingre', '寒', '苦', '肾·膀胱', 2, 6, 2),
        ('jinyinhua', '金银花', 'qingre', '寒', '甘', '肺·心·胃', 1, 18, 11),
        ('lianqiao', '连翘', 'qingre', '微寒', '苦', '肺·心·小肠', 1, 10, 5),
        ('shengdi', '生地黄', 'qingre', '寒', '甘苦', '心·肝·肾', 2, 7, 9),
        ('mudanpi', '牡丹皮', 'qingre', '微寒', '苦辛', '心·肝·肾', 2, 4, 3),
        # 泻下药 (3种)
        ('dahuang', '大黄', 'xiexia', '寒', '苦', '脾·胃·大肠', 2, 6, 4),
        ('mangxiao', '芒硝', 'xiexia', '寒', '咸苦', '胃·大肠', 2, 2, 1),
        ('huomaren', '火麻仁', 'xiexia', '平', '甘', '脾·胃·大肠', 1, 4, 8),
        # 祛风湿药 (5种)
        ('duhuo', '独活', 'qufengshi', '微温', '辛苦', '肝·肾·膀胱', 1, 5, 3),
        ('qianghuo', '羌活', 'qufengshi', '温', '辛苦', '膀胱·肾', 2, 3, 7),
        ('mugua', '木瓜', 'qufengshi', '温', '酸', '肝·脾', 1, 7, 4),
        ('sangjisheng', '桑寄生', 'qufengshi', '平', '苦甘', '肝·肾', 2, 0, 2),
        ('weilingxian', '威灵仙', 'qufengshi', '温', '辛咸', '膀胱', 2, 1, 0),
        # 化湿药 (4种)
        ('cangzhu', '苍术', 'huashi', '温', '辛苦', '脾·胃·肝', 1, 8, 5),
        ('houpo', '厚朴', 'huashi', '温', '苦辛', '脾·胃·肺', 2, 5, 2),
        ('huoxiang', '藿香', 'huashi', '微温', '辛', '脾·胃·肺', 1, 6, 9),
        ('peilan', '佩兰', 'huashi', '平', '辛', '脾·胃·肺', 1, 2, 3),
        # 利水渗湿药 (5种)
        ('fuling', '茯苓', 'lishui', '平', '甘淡', '心·肺·脾·肾', 1, 15, 12),
        ('zexie', '泽泻', 'lishui', '寒', '甘淡', '肾·膀胱', 1, 8, 4),
        ('yiyiren', '薏苡仁', 'lishui', '凉', '甘淡', '脾·胃·肺', 1, 22, 18),
        ('cheqianzi', '车前子', 'lishui', '寒', '甘', '肝·肾·肺', 1, 4, 7),
        ('yinchen', '茵陈', 'lishui', '微寒', '苦辛', '脾·胃·肝·胆', 2, 3, 1),
        # 温里药 (5种)
        ('fuzi', '附子', 'wenli', '大热', '辛甘', '心·肾·脾', 4, 2, 1),
        ('rougui', '肉桂', 'wenli', '大热', '辛甘', '肾·脾·心·肝', 3, 4, 3),
        ('ganjiang', '干姜', 'wenli', '热', '辛', '脾·胃·肾', 1, 9, 6),
        ('wuzhuyu', '吴茱萸', 'wenli', '热', '辛苦', '肝·脾·胃', 2, 3, 5),
        ('huajiao', '花椒', 'wenli', '温', '辛', '脾·胃·肾', 1, 5, 2),
        # 理气药 (5种)
        ('chenpi', '陈皮', 'liqi', '温', '辛苦', '脾·肺', 1, 13, 11),
        ('zhike', '枳壳', 'liqi', '微寒', '苦辛', '脾·胃', 1, 5, 3),
        ('muxiang', '木香', 'liqi', '温', '辛苦', '脾·胃·大肠', 1, 4, 7),
        ('xiangfu', '香附', 'liqi', '平', '辛微苦', '肝·脾·三焦', 1, 7, 9),
        ('foushou', '佛手', 'liqi', '温', '辛苦酸', '肝·脾·肺', 2, 2, 0),
        # 消食药 (4种)
        ('shanzha', '山楂', 'xiaoshi', '微温', '酸甘', '脾·胃·肝', 1, 11, 6),
        ('maiya', '麦芽', 'xiaoshi', '平', '甘', '脾·胃', 1, 8, 4),
        ('jineijin', '鸡内金', 'xiaoshi', '平', '甘', '脾·胃·小肠', 2, 3, 2),
        ('shenqu', '神曲', 'xiaoshi', '温', '甘辛', '脾·胃', 1, 6, 5),
        # 驱虫药 (3种)
        ('shijunzi', '使君子', 'quchong', '温', '甘', '脾·胃', 2, 2, 1),
        ('binglang', '槟榔', 'quchong', '温', '苦辛', '胃·大肠', 2, 0, 3),
        ('kulianpi', '苦楝皮', 'quchong', '寒', '苦', '肝·脾·胃', 2, 1, 0),
        # 止血药 (4种)
        ('sanqi', '三七', 'zhixue', '温', '甘微苦', '肝·胃', 3, 1, 2),
        ('baiji', '白及', 'zhixue', '微寒', '苦甘涩', '肺·肝·胃', 2, 4, 2),
        ('aiye', '艾叶', 'zhixue', '温', '辛苦', '肝·脾·肾', 1, 9, 7),
        ('xianhecao', '仙鹤草', 'zhixue', '平', '苦涩', '心·肝', 1, 3, 1),
        # 活血化瘀药 (5种)
        ('chuanxiong', '川芎', 'huoxue', '温', '辛', '肝·胆·心包', 2, 6, 4),
        ('danshen', '丹参', 'huoxue', '微寒', '苦', '心·肝', 2, 8, 11),
        ('honghua', '红花', 'huoxue', '温', '辛', '心·肝', 2, 3, 2),
        ('taoren', '桃仁', 'huoxue', '平', '苦甘', '心·肝·大肠', 1, 5, 3),
        ('yimu', '益母草', 'huoxue', '微寒', '苦辛', '肝·心·膀胱', 1, 7, 5),
        # 化痰止咳平喘药 (5种)
        ('banxia', '半夏', 'huatan', '温', '辛', '脾·胃·肺', 2, 4, 9),
        ('jiegeng', '桔梗', 'huatan', '平', '苦辛', '肺', 1, 6, 5),
        ('xingren', '杏仁', 'huatan', '微温', '苦', '肺·大肠', 1, 8, 7),
        ('beimu', '贝母', 'huatan', '寒', '苦甘', '肺·心', 3, 2, 3),
        ('kuandonghua', '款冬花', 'huatan', '温', '辛微苦', '肺', 2, 1, 0),
        # 安神药 (4种)
        ('suanzaoren', '酸枣仁', 'anshen', '平', '甘酸', '肝·胆·心', 2, 5, 3),
        ('baiziren', '柏子仁', 'anshen', '平', '甘', '心·肾·大肠', 1, 4, 2),
        ('yuanzhi', '远志', 'anshen', '温', '辛苦', '心·肾·肺', 2, 2, 1),
        ('hehuanpi', '合欢皮', 'anshen', '平', '甘', '心·肝·肺', 1, 3, 0),
        # 平肝息风药 (4种)
        ('tianma', '天麻', 'pinggan', '平', '甘', '肝', 3, 1, 4),
        ('gouteng', '钩藤', 'pinggan', '凉', '甘', '肝·心包', 2, 3, 2),
        ('shijueming', '石决明', 'pinggan', '寒', '咸', '肝', 2, 2, 1),
        ('baijili', '白蒺藜', 'pinggan', '微温', '辛苦', '肝', 1, 4, 0),
        # 开窍药 (3种)
        ('shexiang', '麝香', 'kaiqiao', '温', '辛', '心·脾', 4, 0, 1),
        ('shichangpu', '石菖蒲', 'kaiqiao', '温', '辛苦', '心·胃', 2, 2, 1),
        ('bingpian', '冰片', 'kaiqiao', '微寒', '辛苦', '心·脾·肺', 3, 1, 2),
        # 补虚药 (10种)
        ('renshen', '人参', 'buxu', '微温', '甘微苦', '心·脾·肺', 4, 1, 2),
        ('huangqi', '黄芪', 'buxu', '微温', '甘', '脾·肺', 2, 9, 7),
        ('baizhu', '白术', 'buxu', '温', '苦甘', '脾·胃', 1, 7, 5),
        ('gancao', '甘草', 'buxu', '平', '甘', '心·肺·脾·胃', 1, 18, 22),
        ('danggui', '当归', 'buxu', '温', '甘辛', '肝·心·脾', 2, 5, 8),
        ('shudihuang', '熟地黄', 'buxu', '微温', '甘', '肝·肾', 2, 4, 6),
        ('gouqi', '枸杞子', 'buxu', '平', '甘', '肝·肾·肺', 1, 11, 9),
        ('lurong', '鹿茸', 'buxu', '温', '甘咸', '肝·肾', 4, 1, 0),
        ('ejiao', '阿胶', 'buxu', '平', '甘', '肺·肝·肾', 3, 2, 3),
        # 收涩药 (4种)
        ('wuweizi', '五味子', 'shouse', '温', '酸甘', '肺·心·肾', 2, 4, 3),
        ('shanzhuyu', '山茱萸', 'shouse', '微温', '酸涩', '肝·肾', 2, 3, 2),
        ('wumei', '乌梅', 'shouse', '平', '酸涩', '肝·脾·肺·大肠', 1, 5, 4),
        ('lianzi', '莲子', 'shouse', '平', '甘涩', '脾·肾·心', 1, 7, 5),
    ]

    now = datetime.utcnow().isoformat() + 'Z'
    player_id = 'player_001'

    cursor = conn.cursor()
    inserted = 0

    for herb in herbs_data:
        herb_id, name, cat, xing, wei, gui, rarity, raw_count, piece_count = herb
        try:
            cursor.execute("""
                INSERT INTO inventory
                (player_id, herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (player_id, herb_id, name, cat, xing, wei, gui, rarity, raw_count, piece_count, now))
            inserted += 1
        except Exception as e:
            print(f"[Migration] Skipped {herb_id}: {e}")

    conn.commit()
    print(f"[Migration] Inserted {inserted} herbs into inventory table")