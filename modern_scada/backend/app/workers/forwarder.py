import asyncio
import logging
import json
from app.db.sqlite import SQLiteDB
from app.db.postgres import PostgresDB

logger = logging.getLogger(__name__)

async def forwarder_loop():
    logger.info("Starting Store & Forward Worker")
    while True:
        try:
            # Check buffer
            rows = await SQLiteDB.fetch_all("SELECT id, query, params FROM buffer ORDER BY id ASC LIMIT 100")
            
            if rows:
                logger.info(f"Forwarding {len(rows)} buffered records...")
                for row in rows:
                    row_id, query, params_json = row
                    try:
                        params = json.loads(params_json)
                        # Need to convert ISO strings back to datetime objects if the query expects timestamps
                        # This depends on how asyncpg handles strings for timestamp columns. 
                        # Usually it needs datetime objects.
                        # We'll do a naive parse for now if it looks like a date.
                        from dateutil import parser
                        parsed_params = []
                        for p in params:
                            if isinstance(p, str) and "T" in p:
                                try:
                                    parsed_params.append(parser.parse(p))
                                except:
                                    parsed_params.append(p)
                            else:
                                parsed_params.append(p)
                        
                        await PostgresDB.execute(query, *parsed_params)
                        
                        # Delete from buffer on success
                        await SQLiteDB.execute("DELETE FROM buffer WHERE id = ?", (row_id,))
                    except Exception as e:
                        logger.error(f"Failed to forward record {row_id}: {e}")
                        # Break to retry later or skip? 
                        # If it's a data error, we might get stuck. 
                        # For now, we log and continue to try others, or break to avoid spam.
                        # Let's break to avoid hammering DB with bad query
                        break
            
        except Exception as e:
            logger.error(f"Forwarder error: {e}")
        
        await asyncio.sleep(5) # Check every 5 seconds
