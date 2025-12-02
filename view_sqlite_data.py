import sqlite3
import os
import sys
import json
from datetime import datetime

# Path to the database
# Assuming standard layout
DB_PATH = r"c:\greenhouse\greenhouse-scada\modern_scada\backend\data\buffer.db"

def view_data(limit=20):
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        print("This is expected if the backend has not been run or no buffering has occurred yet.")
        return

    print(f"Connecting to database: {DB_PATH}")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
        if not tables:
            print("No tables found.")
            return

        # Query buffer table
        if 'buffer' in [t[0] for t in tables]:
            cursor.execute("PRAGMA table_info(buffer)")
            columns = cursor.fetchall()
            print(f"Columns: {[c[1] for c in columns]}")
            
            # Get count
            cursor.execute("SELECT COUNT(*) FROM buffer")
            count = cursor.fetchone()[0]
            print(f"Total buffered items: {count}")
            
            print(f"\n--- Last {limit} Buffered Records ---")
            cursor.execute(f"SELECT * FROM buffer ORDER BY created_at DESC LIMIT {limit}")
            rows = cursor.fetchall()
            
            # Print header
            print(f"{'ID':<5} | {'Created At':<25} | {'Data Preview':<50}")
            print("-" * 90)
            
            for row in rows:
                # id, query, params, created_at
                id_val = row[0]
                query = row[1]
                params_str = row[2]
                created_at = row[3]
                
                # Parse params to show something readable
                try:
                    params = json.loads(params_str)
                    # Try to format params nicely
                    preview = str(params)
                    if len(preview) > 50:
                        preview = preview[:47] + "..."
                except:
                    preview = params_str[:50]
                
                print(f"{id_val:<5} | {created_at:<25} | {preview:<50}")
        else:
            print("Table 'buffer' not found.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    limit = 20
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except:
            pass
    view_data(limit)
