import asyncio
import logging
import os
import sys
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)


async def run_daily_crawl():
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
    logger.info("Scheduled daily crawl starting...")
    try:
        from agents.run_all import run_all
        await asyncio.to_thread(run_all)
        logger.info("Scheduled daily crawl complete.")
    except Exception as e:
        logger.error(f"Scheduled crawl failed: {e}")


def start_scheduler():
    hour = int(os.getenv("CRAWL_SCHEDULE_HOUR", "3"))
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_daily_crawl, CronTrigger(hour=hour, minute=0))
    scheduler.start()
    return scheduler
