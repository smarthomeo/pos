from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app import calculate_daily_referral_commissions
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('referral_scheduler')

def start_scheduler():
    """Initialize and start the APScheduler for daily tasks"""
    try:
        scheduler = BackgroundScheduler()
        
        # Schedule the daily commission calculation to run at midnight (00:00) every day
        scheduler.add_job(
            calculate_daily_referral_commissions,
            trigger=CronTrigger(hour=0, minute=0),
            id='calculate_daily_commissions',
            name='Calculate daily referral commissions',
            replace_existing=True
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info("Scheduler started successfully")
        return scheduler
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")
        raise
